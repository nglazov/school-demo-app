import { PrismaClient } from "../src/generated/prisma/index.js";
const prisma = new PrismaClient();

async function main() {
  // 1) Права (permission)
  const permissionKeys = [
    "user:create",
    "user:update",
    "user:delete",
    "user:read",
    "group:create",
    "group:update",
    "group:delete",
    "group:read",
    "role:assign",
    "role:read",
    "report:read",
    "report:export",
  ];

  await prisma.permission.createMany({
    data: permissionKeys.map((key) => ({ key })),
    skipDuplicates: true,
  });

  const p = Object.fromEntries(
    (await prisma.permission.findMany()).map((x) => [x.key, x]),
  );

  // 2) Роли (bundles прав)
  const roles = [
    {
      key: "admin",
      name: "Администратор",
      permissions: [
        "user:create",
        "user:update",
        "user:delete",
        "user:read",
        "group:create",
        "group:update",
        "group:delete",
        "group:read",
        "role:assign",
        "role:read",
        "report:read",
        "report:export",
      ],
    },
    {
      key: "manager",
      name: "Менеджер",
      permissions: ["user:read", "group:read", "report:read", "report:export"],
    },
    {
      key: "teacher",
      name: "Преподаватель",
      permissions: ["user:read", "report:read"],
    },
    {
      key: "viewer",
      name: "Наблюдатель",
      permissions: ["user:read", "group:read", "role:read"],
    },
  ];

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name },
      create: { key: r.key, name: r.name },
    });
    // связываем с правами
    const connect = r.permissions.map((key) => ({
      roleId: role.id,
      permissionId: p[key].id,
    }));
    await prisma.rolePermission.createMany({
      data: connect,
      skipDuplicates: true,
    });
  }

  const roleMap = Object.fromEntries(
    (await prisma.role.findMany()).map((x) => [x.key, x]),
  );

  // 3) Группы (наборы ролей)
  const groups = [
    { key: "admins", name: "Администраторы", roles: ["admin"] },
    { key: "managers", name: "Менеджеры", roles: ["manager"] },
    { key: "teachers", name: "Преподаватели", roles: ["teacher"] },
    { key: "viewers", name: "Наблюдатели", roles: ["viewer"] },
  ];

  for (const g of groups) {
    const group = await prisma.group.upsert({
      where: { key: g.key },
      update: { name: g.name },
      create: { key: g.key, name: g.name },
    });

    await prisma.groupRole.createMany({
      data: g.roles.map((rk) => ({
        groupId: group.id,
        roleId: roleMap[rk].id,
      })),
      skipDuplicates: true,
    });
  }

  // 4) Тест-пользователь и назначение группы
  const email = "admin@example.com";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: "$2a$12$abcdefghijklmnopqrstuv", // поставь реальный hash
    },
  });

  const adminsGroup = await prisma.group.findUnique({
    where: { key: "admins" },
  });
  if (adminsGroup) {
    await prisma.userGroup.upsert({
      where: { userId_groupId: { userId: user.id, groupId: adminsGroup.id } },
      update: {},
      create: { userId: user.id, groupId: adminsGroup.id },
    });
  }

  console.log("✅ RBAC seed complete");
}

main().finally(() => prisma.$disconnect());
