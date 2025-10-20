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
];

async function upsertPermissions() {
  const tx = BASE_PERMS.map((p) =>
    prisma.permission.upsert({
      where: {
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

// С учётом autoincrement на UserGroup.id
async function ensureUserGroupForUser(userId: number) {
  const existing = await prisma.userGroup.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.userGroup.create({
    data: { userId, joinedAt: new Date() },
    select: { id: true },
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
  console.log("🌱 Seeding permissions & user groups...");

  const perms = await upsertPermissions();
  const byType = (t: string) => perms.filter((p) => p.type === t);
  const pick = (t: string, action?: string, scope?: string) =>
    perms.filter(
      (p) =>
        p.type === t &&
        (!action || p.action === action) &&
        (!scope || p.scope === scope),
    );

  const adminPwd = process.env.ADMIN_PASSWORD ?? "admin";
  const teacherPwd = process.env.TEACHER_PASSWORD ?? "teacher";

  const admin = await ensureUser("admin", adminPwd);
  const teacher = await ensureUser("teacher", teacherPwd);

  const adminGroup = await ensureUserGroupForUser(admin.id);
  const teacherGroup = await ensureUserGroupForUser(teacher.id);

  await linkPermissionsToGroup(
    adminGroup.id,
    perms.map((p) => p.id),
  );

  const teacherPerms = [
    ...byType("student"),
    ...byType("guardian"),
    ...pick("lesson", "read"),
    ...pick("room", "read"),
    ...pick("subject", "read"),
    ...pick("family", "read", "own"),
  ];
  await linkPermissionsToGroup(
    teacherGroup.id,
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
