/*
  Warnings:

  - You are about to drop the `CapabilityOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubjectCapabilityRuleOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CapabilityOption" DROP CONSTRAINT "CapabilityOption_capabilityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoomCapability" DROP CONSTRAINT "RoomCapability_optionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubjectCapabilityRule" DROP CONSTRAINT "SubjectCapabilityRule_optionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubjectCapabilityRuleOption" DROP CONSTRAINT "SubjectCapabilityRuleOption_optionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubjectCapabilityRuleOption" DROP CONSTRAINT "SubjectCapabilityRuleOption_ruleId_fkey";

-- DropTable
DROP TABLE "public"."CapabilityOption";

-- DropTable
DROP TABLE "public"."SubjectCapabilityRuleOption";
