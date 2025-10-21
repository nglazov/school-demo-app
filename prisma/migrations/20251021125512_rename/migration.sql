/*
  Warnings:

  - You are about to drop the column `staffId` on the `Subject` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Subject" DROP CONSTRAINT "Subject_staffId_fkey";

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "staffId";
