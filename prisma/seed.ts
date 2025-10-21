// prisma/seed.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type PermTriple = {
  type: string;
  action: "read" | "write";
  scope: "own" | "all";
};

const BASE_PERMS: PermTriple[] = [
  { type: "user", action: "read", scope: "all" },
  { type: "user", action: "write", scope: "all" },
  { type: "student", action: "read", scope: "all" },
  { type: "student", action: "write", scope: "all" },
  { type: "guardian", action: "read", scope: "all" },
  { type: "lesson", action: "read", scope: "all" },
  { type: "room", action: "read", scope: "all" },
  { type: "subject", action: "read", scope: "all" },
  { type: "family", action: "read", scope: "own" },
  { type: "capability", action: "read", scope: "all" },
  { type: "capability", action: "write", scope: "all" },
  { type: "building", action: "read", scope: "all" },
  { type: "building", action: "write", scope: "all" },
];

async function upsertPermissions() {
  const tx = BASE_PERMS.map((p) =>
    prisma.permission.upsert({
      where: {
        // composite unique from @@unique([type, action, scope])
        type_action_scope: { type: p.type, action: p.action, scope: p.scope },
      },
      update: {},
      create: { ...p },
      select: { id: true, type: true, action: true, scope: true },
    }),
  );
  return prisma.$transaction(tx);
}

async function ensureUser(username: string, plainPassword: string) {
  const rounds = Number(process.env.HASH_SALT ?? 12);
  const passwordHash = await bcrypt.hash(plainPassword, rounds);

  return prisma.user.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
    select: { id: true, username: true },
  });
}

/**
 * Т.к. в схеме нет unique на name у UserGroup, используем findFirst+create.
 */
async function ensureRoleGroup(name: string) {
  const existing = await prisma.userGroup.findFirst({
    where: { name },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  return prisma.userGroup.create({
    data: { name, joinedAt: new Date() },
    select: { id: true, name: true },
  });
}

async function addUserToGroup(userId: number, userGroupId: number) {
  // @@id([userId, userGroupId]) позволяет upsert по составному ключу
  await prisma.userUserGroup.upsert({
    where: { userId_userGroupId: { userId, userGroupId } },
    update: {},
    create: { userId, userGroupId },
  });
}

async function linkPermissionsToGroup(userGroupId: number, permIds: number[]) {
  const tx = permIds.map((pid) =>
    prisma.userGroupPermission.upsert({
      where: { userGroupId_permissionId: { userGroupId, permissionId: pid } },
      update: {},
      create: { userGroupId, permissionId: pid },
    }),
  );
  await prisma.$transaction(tx);
}

async function main() {
  console.log("🌱 Seeding permissions, users and role groups...");

  // 1) Права
  const perms = await upsertPermissions();
  const byType = (t: string) => perms.filter((p) => p.type === t);
  const pick = (t: string, action?: "read" | "write", scope?: "own" | "all") =>
    perms.filter(
      (p) =>
        p.type === t &&
        (action ? p.action === action : true) &&
        (scope ? p.scope === scope : true),
    );

  // 2) Пользователи
  const adminPwd = process.env.ADMIN_PASSWORD ?? "admin";
  const teacherPwd = process.env.TEACHER_PASSWORD ?? "teacher";

  const admin = await ensureUser("admin", adminPwd);
  const teacher = await ensureUser("teacher", teacherPwd);

  // 3) Ролевые группы
  const adminsGroup = await ensureRoleGroup("Admins");
  const teachersGroup = await ensureRoleGroup("Teachers");

  // 4) Вступление пользователей в группы (через UserUserGroup)
  await addUserToGroup(admin.id, adminsGroup.id);
  await addUserToGroup(teacher.id, teachersGroup.id);

  // 5) Права на группы
  // Админы — все права
  await linkPermissionsToGroup(
    adminsGroup.id,
    perms.map((p) => p.id),
  );

  // Учителя — ограниченный набор
  const teacherPerms = [
    ...byType("student"),
    ...byType("guardian"),
    ...pick("lesson", "read"),
    ...pick("room", "read"),
    ...pick("subject", "read"),
    ...pick("family", "read", "own"),
  ];
  await linkPermissionsToGroup(
    teachersGroup.id,
    teacherPerms.map((p) => p.id),
  );

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
