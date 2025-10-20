// prisma/seed.ts
import { PrismaClient, StaffType } from "@prisma/client";
import { hash } from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding RBAC...");

  // ===== Permissions =====
  // Глобальные права для суперадмина/админперсонала
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
    // Родитель видит только свою семью
    prisma.permission.upsert({
      where: { key: "family:read_own" },
      update: {},
      create: {
        key: "family:read_own",
        description: "Parent can read own family",
      },
    }),
    // Педагог видит свою учебную группу, её учеников и их родителей
    prisma.permission.upsert({
      where: { key: "group:read_assigned" },
      update: {},
      create: {
        key: "group:read_assigned",
        description: "Teacher can read assigned group and related people",
      },
    }),
    prisma.permission.upsert({
      where: { key: "schedule:manage_group" },
      update: {},
      create: {
        key: "schedule:manage_group",
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
    where: { key: "admin_staff" },
    update: {},
    create: {
      key: "admin_staff",
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

  // ===== Auth Groups (containers for roles) =====
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
    where: { key: "admin_staff" },
    update: {},
    create: {
      key: "admin_staff",
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

  // ===== Admin user (sees everything) =====
  console.log("👤 Creating admin user...");
  const adminPassword = await hash(
    "admin",
    Number(process.env.HASH_SALT) || 10,
  );

  console.log(process.env.HASH_SALT);

  const adminPerson = await prisma.person.upsert({
    where: { id: 1 }, // безопасный upsert через unique; если хочешь по email, меняй where
    update: {},
    create: {
      first_name: "System",
      last_name: "Admin",
      email: "admin@example.com",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password_hash: adminPassword,
      person: { connect: { id: adminPerson.id } },
      groups: { create: { group: { connect: { id: adminsGroup.id } } } },
    },
  });

  // ===== Minimal domain data =====
  console.log("🏫 Creating academic structure...");
  const year = await prisma.academicYear.upsert({
    where: { code: "2024/2025" },
    update: {},
    create: {
      code: "2024/2025",
      starts_on: new Date("2024-09-01T00:00:00Z"),
      ends_on: new Date("2025-05-31T00:00:00Z"),
    },
  });

  const group1A = await prisma.eduGroup.upsert({
    where: { key: "class-1A-2024" },
    update: {},
    create: {
      key: "class-1A-2024",
      name: "1A",
      grade_level: 1,
      academic_year_id: year.id,
    },
  });

  const building = await prisma.building.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "Main Campus", address: "123 School St." },
  });

  const room101 = await prisma.room.upsert({
    where: {
      // unique по (building_id, name) в Prisma — составной нужно через find/create; делаем простой upsert по surrogate
      id: 1,
    },
    update: {},
    create: { name: "101", building_id: building.id, capacity: 24 },
  });

  const subjectMath = await prisma.subject.upsert({
    where: { code: "MATH" },
    update: {},
    create: { code: "MATH", name: "Mathematics" },
  });

  // ===== Teacher (staff) =====
  console.log("👩‍🏫 Creating teacher...");
  const teacherPerson = await prisma.person.create({
    data: { first_name: "Alice", last_name: "Teacher" },
  });
  const teacherStaff = await prisma.staff.create({
    data: { person_id: teacherPerson.id, type: StaffType.TEACHER },
  });

  // ===== Family (guardian + student) =====
  console.log("👨‍👩‍👧 Creating family...");
  const fam = await prisma.family.create({
    data: { key: "family-ivanov", name: "Family Ivanov" },
  });

  const studentPerson = await prisma.person.create({
    data: { first_name: "Ivan", last_name: "Ivanov" },
  });
  const student = await prisma.student.create({
    data: { person_id: studentPerson.id, external_id: "S-0001" },
  });

  const guardianPerson = await prisma.person.create({
    data: {
      first_name: "Petr",
      last_name: "Ivanov",
      email: "parent@example.com",
    },
  });
  const guardian = await prisma.guardian.create({
    data: { person_id: guardianPerson.id, type: "PARENT" },
  });

  await prisma.familyMember.createMany({
    data: [
      { family_id: fam.id, role: "STUDENT", student_id: student.id },
      { family_id: fam.id, role: "GUARDIAN", guardian_id: guardian.id },
    ],
    skipDuplicates: true,
  });

  // Привязываем ученика к группе
  await prisma.groupMembership.create({
    data: { student_id: student.id, group_id: group1A.id },
  });

  // ===== Add sample lesson batch & lessons (DRAFT) =====
  console.log("🗓️ Creating lesson batch...");
  const batch = await prisma.lessonBatch.upsert({
    where: { key: "demo-week" },
    update: {},
    create: {
      key: "demo-week",
      title: "Demo Draft Week",
      created_by: adminUser.id,
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
        starts_at_min: 9 * 60,
        ends_at_min: 10 * 60,
        group_id: group1A.id,
        room_id: room101.id,
        subject_id: subjectMath.id,
        teacher_id: teacherStaff.id,
        batch_id: batch.id,
        status: "DRAFT",
      },
    });
  }

  // ===== Optional: put example users into role-based groups =====
  // Пример: учитель в группу teachers; родитель в группу parents
  await prisma.user.create({
    data: {
      username: "teacher",
      password_hash: await hash("teacher", 10),
      person: { connect: { id: teacherPerson.id } },
      groups: { create: { group: { connect: { id: teachersGroup.id } } } },
    },
  });

  await prisma.user.create({
    data: {
      username: "parent",
      password_hash: await hash("parent", 10),
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
