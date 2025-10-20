// prisma/seed.ts
import { PrismaClient, StaffType } from "@prisma/client";
import { hash } from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding RBAC...");

  // ===== Permissions =====
  const perms = await prisma.$transaction([
    prisma.permission.upsert({
      where: { key: "all:read" },
      update: {},
      create: { key: "all:read", description: "Read everything" },
    }),
    prisma.permission.upsert({
      where: { key: "all:write" },
      update: {},
      create: { key: "all:write", description: "Write everything" },
    }),
    prisma.permission.upsert({
      where: { key: "family:readOwn" },
      update: {},
      create: {
        key: "family:readOwn",
        description: "Parent can read own family",
      },
    }),
    prisma.permission.upsert({
      where: { key: "group:readAssigned" },
      update: {},
      create: {
        key: "group:readAssigned",
        description: "Teacher can read assigned group and related people",
      },
    }),
    prisma.permission.upsert({
      where: { key: "schedule:manageGroup" },
      update: {},
      create: {
        key: "schedule:manageGroup",
        description: "Teacher can manage schedule for assigned group",
      },
    }),
  ]);

  const [
    permReadAll,
    permWriteAll,
    permFamilyReadOwn,
    permGroupReadAssigned,
    permScheduleManageGroup,
  ] = perms;

  // ===== Roles =====
  const superAdminRole = await prisma.role.upsert({
    where: { key: "superadmin" },
    update: {},
    create: {
      key: "superadmin",
      name: "Super Admin",
      permissions: {
        create: [
          { permission: { connect: { id: permReadAll.id } } },
          { permission: { connect: { id: permWriteAll.id } } },
        ],
      },
    },
  });

  const adminStaffRole = await prisma.role.upsert({
    where: { key: "adminStaff" },
    update: {},
    create: {
      key: "adminStaff",
      name: "Administrative Staff",
      permissions: {
        create: [
          { permission: { connect: { id: permReadAll.id } } },
          { permission: { connect: { id: permWriteAll.id } } },
        ],
      },
    },
  });

  const teacherRole = await prisma.role.upsert({
    where: { key: "teacher" },
    update: {},
    create: {
      key: "teacher",
      name: "Teacher",
      permissions: {
        create: [
          { permission: { connect: { id: permGroupReadAssigned.id } } },
          { permission: { connect: { id: permScheduleManageGroup.id } } },
        ],
      },
    },
  });

  const parentRole = await prisma.role.upsert({
    where: { key: "parent" },
    update: {},
    create: {
      key: "parent",
      name: "Parent",
      permissions: {
        create: [{ permission: { connect: { id: permFamilyReadOwn.id } } }],
      },
    },
  });

  // ===== Auth Groups =====
  const adminsGroup = await prisma.authGroup.upsert({
    where: { key: "admins" },
    update: {},
    create: {
      key: "admins",
      name: "Administrators",
      roles: { create: { role: { connect: { id: superAdminRole.id } } } },
    },
  });

  const adminStaffGroup = await prisma.authGroup.upsert({
    where: { key: "adminStaff" },
    update: {},
    create: {
      key: "adminStaff",
      name: "Administrative Staff",
      roles: { create: { role: { connect: { id: adminStaffRole.id } } } },
    },
  });

  const teachersGroup = await prisma.authGroup.upsert({
    where: { key: "teachers" },
    update: {},
    create: {
      key: "teachers",
      name: "Teachers",
      roles: { create: { role: { connect: { id: teacherRole.id } } } },
    },
  });

  const parentsGroup = await prisma.authGroup.upsert({
    where: { key: "parents" },
    update: {},
    create: {
      key: "parents",
      name: "Parents",
      roles: { create: { role: { connect: { id: parentRole.id } } } },
    },
  });

  // ===== Admin user =====
  console.log("👤 Creating admin user...");
  const adminPassword = await hash(
    "admin",
    Number(process.env.HASH_SALT) || 10,
  );

  const adminPerson = await prisma.person.upsert({
    where: { id: 1 },
    update: {},
    create: {
      firstName: "System",
      lastName: "Admin",
      email: "admin@example.com",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPassword,
      person: { connect: { id: adminPerson.id } },
      groups: { create: { group: { connect: { id: adminsGroup.id } } } },
    },
  });

  // ===== Academic structure =====
  console.log("🏫 Creating academic structure...");
  const year = await prisma.academicYear.upsert({
    where: { code: "2024/2025" },
    update: {},
    create: {
      code: "2024/2025",
      startsOn: new Date("2024-09-01T00:00:00Z"),
      endsOn: new Date("2025-05-31T00:00:00Z"),
    },
  });

  const group1A = await prisma.eduGroup.upsert({
    where: { key: "class-1A-2024" },
    update: {},
    create: {
      key: "class-1A-2024",
      name: "1A",
      gradeLevel: 1,
      academicYearId: year.id,
    },
  });

  const building = await prisma.building.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Main Campus", address: "123 School St." },
  });

  const room101 = await prisma.room.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "101", buildingId: building.id, capacity: 24 },
  });

  const subjectMath = await prisma.subject.upsert({
    where: { code: "MATH" },
    update: {},
    create: { code: "MATH", name: "Mathematics" },
  });

  // ===== Teacher =====
  console.log("👩‍🏫 Creating teacher...");
  const teacherPerson = await prisma.person.create({
    data: { firstName: "Alice", lastName: "Teacher" },
  });
  const teacherStaff = await prisma.staff.create({
    data: { personId: teacherPerson.id, type: StaffType.TEACHER },
  });

  // ===== Family =====
  console.log("👨‍👩‍👧 Creating family...");
  const family = await prisma.family.create({
    data: { key: "family-ivanov", name: "Family Ivanov" },
  });

  const studentPerson = await prisma.person.create({
    data: { firstName: "Ivan", lastName: "Ivanov" },
  });
  const student = await prisma.student.create({
    data: { personId: studentPerson.id, externalId: "S-0001" },
  });

  const guardianPerson = await prisma.person.create({
    data: {
      firstName: "Petr",
      lastName: "Ivanov",
      email: "parent@example.com",
    },
  });
  const guardian = await prisma.guardian.create({
    data: { personId: guardianPerson.id, type: "PARENT" },
  });

  await prisma.familyMember.createMany({
    data: [
      { familyId: family.id, role: "STUDENT", studentId: student.id },
      { familyId: family.id, role: "GUARDIAN", guardianId: guardian.id },
    ],
    skipDuplicates: true,
  });

  await prisma.groupMembership.create({
    data: { studentId: student.id, groupId: group1A.id },
  });

  // ===== Lessons =====
  console.log("🗓️ Creating lesson batch...");
  const batch = await prisma.lessonBatch.upsert({
    where: { key: "demo-week" },
    update: {},
    create: {
      key: "demo-week",
      title: "Demo Draft Week",
      createdBy: adminUser.id,
    },
  });

  const today = new Date();
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  for (let i = 0; i < 3; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    await prisma.lesson.create({
      data: {
        date: d,
        startsAtMin: 9 * 60,
        endsAtMin: 10 * 60,
        groupId: group1A.id,
        roomId: room101.id,
        subjectId: subjectMath.id,
        teacherId: teacherStaff.id,
        batchId: batch.id,
        status: "DRAFT",
      },
    });
  }

  // ===== Example users =====
  await prisma.user.create({
    data: {
      username: "teacher",
      passwordHash: await hash("teacher", 10),
      person: { connect: { id: teacherPerson.id } },
      groups: { create: { group: { connect: { id: teachersGroup.id } } } },
    },
  });

  await prisma.user.create({
    data: {
      username: "parent",
      passwordHash: await hash("parent", 10),
      person: { connect: { id: guardianPerson.id } },
      groups: { create: { group: { connect: { id: parentsGroup.id } } } },
    },
  });

  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
