// prisma/seed.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, CapabilityValueType, Prisma } from "@prisma/client";

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
  { type: "family", action: "read", scope: "own" },
  { type: "capability", action: "read", scope: "all" },
  { type: "capability", action: "write", scope: "all" },
  { type: "building", action: "read", scope: "all" },
  { type: "building", action: "write", scope: "all" },
  { type: "subject", action: "read", scope: "all" },
  { type: "subject", action: "write", scope: "all" },
  { type: "group", action: "read", scope: "all" },
  { type: "group", action: "write", scope: "all" },
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

/** AcademicYear: уникален по code → upsert */
async function ensureAcademicYear(code: string, startsOn: Date, endsOn: Date) {
  return prisma.academicYear.upsert({
    where: { code },
    update: { startsOn, endsOn },
    create: { code, startsOn, endsOn },
    select: { id: true, code: true },
  });
}

/** В схеме нет unique на name у Building → findFirst + create. */
async function ensureBuilding(name: string, address?: string | null) {
  const existing = await prisma.building.findFirst({
    where: { name },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.building.create({
    data: { name, address: address ?? null },
    select: { id: true },
  });
}

/** Capability уникальна по key → upsert. */
async function ensureCapability(
  key: string,
  name: string,
  valueType: CapabilityValueType,
) {
  return prisma.capability.upsert({
    where: { key },
    update: { name, valueType },
    create: { key, name, valueType },
    select: { id: true, key: true },
  });
}

/** EduGroup уникальна по key → upsert. */
async function ensureEduGroup(params: {
  key: string;
  name: string;
  academicYearId: number;
  gradeLevel?: string | null;
  track?: string | null;
}) {
  const { key, name, academicYearId, gradeLevel, track } = params;
  return prisma.eduGroup.upsert({
    where: { key },
    update: { name, academicYearId, gradeLevel, track },
    create: { key, name, academicYearId, gradeLevel, track },
    select: { id: true, key: true, academicYearId: true },
  });
}

/** Room уникальна по (buildingId, name) → upsert по составному ключу. */
async function ensureRoom(
  buildingId: number,
  name: string,
  capacity?: number | null,
  notes?: string | null,
) {
  return prisma.room.upsert({
    where: { buildingId_name: { buildingId, name } },
    update: { capacity: capacity ?? null, notes: notes ?? null },
    create: {
      buildingId,
      name,
      capacity: capacity ?? null,
      notes: notes ?? null,
    },
    select: { id: true, buildingId: true },
  });
}

/** RoomCapability по составному ключу. */
async function upsertRoomCapabilityBool(
  roomId: number,
  capabilityId: number,
  value: boolean,
) {
  await prisma.roomCapability.upsert({
    where: { roomId_capabilityId: { roomId, capabilityId } },
    update: { boolValue: value, intValue: null, textValue: null },
    create: { roomId, capabilityId, boolValue: value },
  });
}

async function upsertRoomCapabilityInt(
  roomId: number,
  capabilityId: number,
  value: number,
) {
  await prisma.roomCapability.upsert({
    where: { roomId_capabilityId: { roomId, capabilityId } },
    update: { intValue: value, boolValue: null, textValue: null },
    create: { roomId, capabilityId, intValue: value },
  });
}

/** UserGroup (роль) — нет уникальности name → findFirst + create. */
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

/** Создание Person+Student с якорем по externalId (идемпотентно). */
async function ensureStudent(params: {
  externalId: string; // используем как «уникальный» сид-идентификатор
  firstName: string;
  lastName: string;
  middleName?: string | null;
  birthDate?: Date | null;
  phone?: string | null;
  email?: string | null;
}) {
  const existing = await prisma.student.findFirst({
    where: { externalId: params.externalId },
    select: { id: true },
  });
  if (existing) return existing;

  const student = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        firstName: params.firstName,
        lastName: params.lastName,
        middleName: params.middleName ?? null,
        birthDate: params.birthDate ?? null,
        phone: params.phone ?? null,
        email: params.email ?? null,
      },
      select: { id: true },
    });

    return tx.student.create({
      data: {
        personId: person.id,
        externalId: params.externalId,
      },
      select: { id: true },
    });
  });

  return student;
}

/** Членство студента в группе: если есть активное (until == null), не дублируем. */
async function ensureGroupMembership(
  studentId: number,
  groupId: number,
  since: Date,
) {
  const exists = await prisma.groupMembership.findFirst({
    where: { studentId, groupId, until: null },
    select: { id: true },
  });
  if (exists) return exists;

  return prisma.groupMembership.create({
    data: { studentId, groupId, since },
    select: { id: true },
  });
}

async function main() {
  console.log("🌱 Seeding permissions, users, groups...");
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

  // 4) Членство пользователей
  await addUserToGroup(admin.id, adminsGroup.id);
  await addUserToGroup(teacher.id, teachersGroup.id);

  // 5) Права на группы
  await linkPermissionsToGroup(
    adminsGroup.id,
    perms.map((p) => p.id),
  );
  const teacherPerms = [
    ...byType("student"),
    ...byType("guardian"),
    ...pick("lesson", "read"),
    ...pick("room", "read"),
    ...pick("subject", "read"),
    ...pick("family", "read", "own"),
    ...pick("group", "read"),
  ];
  await linkPermissionsToGroup(
    teachersGroup.id,
    teacherPerms.map((p) => p.id),
  );

  // === DEMO DATA (infrastructure) ===
  console.log("🏫 Seeding building, capabilities, rooms...");
  const school = await ensureBuilding("Школа");

  const capCapacity = await ensureCapability(
    "capacity",
    "Вместимость",
    CapabilityValueType.INT,
  );
  const capProjector = await ensureCapability(
    "projector",
    "Проектор",
    CapabilityValueType.BOOL,
  );
  await ensureCapability("kitchen", "Кухня", CapabilityValueType.BOOL);

  const room1 = await ensureRoom(school.id, "Кабинет 1", 10, null);
  const room2 = await ensureRoom(school.id, "Кабинет 2", 20, null);

  await upsertRoomCapabilityInt(room1.id, capCapacity.id, 10);
  await upsertRoomCapabilityBool(room1.id, capProjector.id, true);
  await upsertRoomCapabilityInt(room2.id, capCapacity.id, 20);
  await upsertRoomCapabilityBool(room2.id, capProjector.id, true);

  // === DEMO DATA (academic year + groups + students) ===
  console.log("📅 Seeding academic year 25/26 and edu groups...");

  const year = await ensureAcademicYear(
    "25/26",
    new Date("2025-09-01"),
    new Date("2026-06-15"),
  );

  const g7a = await ensureEduGroup({
    key: "7a-25-26",
    name: "7А",
    academicYearId: year.id,
    gradeLevel: "7",
    track: "A",
  });
  const g7b = await ensureEduGroup({
    key: "7b-25-26",
    name: "7Б",
    academicYearId: year.id,
    gradeLevel: "7",
    track: "B",
  });
  const g8a = await ensureEduGroup({
    key: "8a-25-26",
    name: "8А",
    academicYearId: year.id,
    gradeLevel: "8",
    track: "A",
  });

  // Наборы учеников для примера (externalId — якорь для идемпотентности)
  const students7a = [
    { ext: "7A-001", last: "Иванов", first: "Артём" },
    { ext: "7A-002", last: "Петров", first: "Максим" },
    { ext: "7A-003", last: "Сидоров", first: "Илья" },
    { ext: "7A-004", last: "Кузнецова", first: "Анна" },
    { ext: "7A-005", last: "Попова", first: "Мария" },
    { ext: "7A-006", last: "Смирнов", first: "Даниил" },
  ];
  const students7b = [
    { ext: "7B-001", last: "Васильев", first: "Кирилл" },
    { ext: "7B-002", last: "Зайцева", first: "Ева" },
    { ext: "7B-003", last: "Соколова", first: "Полина" },
    { ext: "7B-004", last: "Николаев", first: "Матвей" },
    { ext: "7B-005", last: "Ковалёва", first: "Алиса" },
    { ext: "7B-006", last: "Голубев", first: "Роман" },
    { ext: "7B-007", last: "Морозова", first: "Екатерина" },
  ];
  const students8a = [
    { ext: "8A-001", last: "Фёдоров", first: "Егор" },
    { ext: "8A-002", last: "Михайлова", first: "Вера" },
    { ext: "8A-003", last: "Беляев", first: "Павел" },
    { ext: "8A-004", last: "Тарасова", first: "Александра" },
    { ext: "8A-005", last: "Громов", first: "Тимофей" },
    { ext: "8A-006", last: "Ершова", first: "Милана" },
  ];

  // Создаём студентов и включаем их в группы с начала учебного года
  const since = new Date("2025-09-01");

  const createPack = async (
    pairs: { ext: string; last: string; first: string }[],
    groupId: number,
  ) => {
    for (const s of pairs) {
      const st = await ensureStudent({
        externalId: s.ext,
        firstName: s.first,
        lastName: s.last,
      });
      await ensureGroupMembership(st.id, groupId, since);
    }
  };

  await createPack(students7a, g7a.id);
  await createPack(students7b, g7b.id);
  await createPack(students8a, g8a.id);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma error code:", e.code, e.message);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
