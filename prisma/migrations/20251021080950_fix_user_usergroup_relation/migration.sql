/*
  Warnings:

  - You are about to drop the column `userUserGroupUserGroupId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userUserGroupUserId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserGroup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LessonBatch" DROP CONSTRAINT "LessonBatch_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."LessonEvent" DROP CONSTRAINT "LessonEvent_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserGroup" DROP CONSTRAINT "UserGroup_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userUserGroupUserGroupId",
DROP COLUMN "userUserGroupUserId";

-- AlterTable
ALTER TABLE "UserGroup" DROP COLUMN "userId";
