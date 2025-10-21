/*
  Warnings:

  - You are about to drop the column `permissionId` on the `UserUserGroup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserUserGroup" DROP CONSTRAINT "UserUserGroup_permissionId_fkey";

-- AlterTable
ALTER TABLE "UserUserGroup" DROP COLUMN "permissionId";
