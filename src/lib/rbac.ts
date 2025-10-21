// lib/rbac.ts
import { prisma } from "./prisma";

export async function checkPermission(
  userId: number,
  type: string,
  action: string,
  scope: string = "all",
) {
  const has = await prisma.userGroupPermission.findFirst({
    where: {
      userGroup: {
        user: {
          some: {
            userId,
          },
        },
      },
      permission: {
        type,
        action,
        scope,
      },
    },
    select: { permissionId: true },
  });

  if (!has) {
    throw new Error("FORBIDDEN");
  }
}
