-- CreateEnum
CREATE TYPE "GuardianType" AS ENUM ('PARENT', 'TUTOR', 'CAREGIVER');

-- CreateEnum
CREATE TYPE "FamilyMemberRole" AS ENUM ('STUDENT', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "CapabilityValueType" AS ENUM ('BOOL', 'ENUM', 'INT', 'TEXT');

-- CreateEnum
CREATE TYPE "CapabilityOperator" AS ENUM ('REQUIRED', 'PROHIBITED', 'EQUALS', 'IN', 'GTE', 'LTE');

-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('TEACHER', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'CANCELED', 'COMPLETED', 'DRAFT');

-- CreateEnum
CREATE TYPE "LessonEventType" AS ENUM ('CREATED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED', 'NOTE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "AuthGroup" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRole" (
    "groupId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "GroupRole_pkey" PRIMARY KEY ("groupId","roleId")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("userId","groupId")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "externalId" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "type" "GuardianType" NOT NULL DEFAULT 'PARENT',

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" SERIAL NOT NULL,
    "familyId" INTEGER NOT NULL,
    "role" "FamilyMemberRole" NOT NULL,
    "studentId" INTEGER,
    "guardianId" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EduGroup" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" INTEGER,
    "academicYearId" INTEGER NOT NULL,
    "track" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EduGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "until" TIMESTAMP(3),

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "notes" TEXT,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "valueType" "CapabilityValueType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityOption" (
    "id" SERIAL NOT NULL,
    "capabilityId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CapabilityOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomCapability" (
    "roomId" INTEGER NOT NULL,
    "capabilityId" INTEGER NOT NULL,
    "boolValue" BOOLEAN,
    "intValue" INTEGER,
    "textValue" TEXT,
    "optionId" INTEGER,

    CONSTRAINT "RoomCapability_pkey" PRIMARY KEY ("roomId","capabilityId")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectCapabilityRule" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "capabilityId" INTEGER NOT NULL,
    "operator" "CapabilityOperator" NOT NULL,
    "boolValue" BOOLEAN,
    "intValue" INTEGER,
    "textValue" TEXT,
    "optionId" INTEGER,

    CONSTRAINT "SubjectCapabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectCapabilityRuleOption" (
    "ruleId" INTEGER NOT NULL,
    "optionId" INTEGER NOT NULL,

    CONSTRAINT "SubjectCapabilityRuleOption_pkey" PRIMARY KEY ("ruleId","optionId")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "type" "StaffType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAvailability" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startsAtMin" INTEGER NOT NULL,
    "endsAtMin" INTEGER NOT NULL,
    "intervalWeeks" INTEGER NOT NULL DEFAULT 1,
    "weekOffset" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "StaffAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffException" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "StaffException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonBatch" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,

    CONSTRAINT "LessonBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonEvent" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "type" "LessonEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "message" TEXT,

    CONSTRAINT "LessonEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startsAtMin" INTEGER NOT NULL,
    "endsAtMin" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "batchId" INTEGER,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AuthGroup_key_key" ON "AuthGroup"("key");

-- CreateIndex
CREATE INDEX "UserGroup_groupId_idx" ON "UserGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_personId_key" ON "Student"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_personId_key" ON "Guardian"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Family_key_key" ON "Family"("key");

-- CreateIndex
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");

-- CreateIndex
CREATE INDEX "FamilyMember_studentId_idx" ON "FamilyMember"("studentId");

-- CreateIndex
CREATE INDEX "FamilyMember_guardianId_idx" ON "FamilyMember"("guardianId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_code_key" ON "AcademicYear"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EduGroup_key_key" ON "EduGroup"("key");

-- CreateIndex
CREATE INDEX "EduGroup_academicYearId_idx" ON "EduGroup"("academicYearId");

-- CreateIndex
CREATE INDEX "GroupMembership_groupId_idx" ON "GroupMembership"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_studentId_groupId_since_key" ON "GroupMembership"("studentId", "groupId", "since");

-- CreateIndex
CREATE INDEX "Room_buildingId_idx" ON "Room"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_buildingId_name_key" ON "Room"("buildingId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_key_key" ON "Capability"("key");

-- CreateIndex
CREATE INDEX "CapabilityOption_capabilityId_idx" ON "CapabilityOption"("capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityOption_capabilityId_key_key" ON "CapabilityOption"("capabilityId", "key");

-- CreateIndex
CREATE INDEX "RoomCapability_capabilityId_idx" ON "RoomCapability"("capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "SubjectCapabilityRule_capabilityId_idx" ON "SubjectCapabilityRule"("capabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectCapabilityRule_subjectId_capabilityId_operator_key" ON "SubjectCapabilityRule"("subjectId", "capabilityId", "operator");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_personId_key" ON "Staff"("personId");

-- CreateIndex
CREATE INDEX "StaffAvailability_staffId_weekday_idx" ON "StaffAvailability"("staffId", "weekday");

-- CreateIndex
CREATE INDEX "StaffException_staffId_date_idx" ON "StaffException"("staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StaffException_staffId_date_key" ON "StaffException"("staffId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LessonBatch_key_key" ON "LessonBatch"("key");

-- CreateIndex
CREATE INDEX "LessonBatch_key_idx" ON "LessonBatch"("key");

-- CreateIndex
CREATE INDEX "LessonBatch_createdAt_idx" ON "LessonBatch"("createdAt");

-- CreateIndex
CREATE INDEX "LessonEvent_batchId_idx" ON "LessonEvent"("batchId");

-- CreateIndex
CREATE INDEX "LessonEvent_createdAt_idx" ON "LessonEvent"("createdAt");

-- CreateIndex
CREATE INDEX "LessonEvent_type_idx" ON "LessonEvent"("type");

-- CreateIndex
CREATE INDEX "Lesson_date_startsAtMin_endsAtMin_idx" ON "Lesson"("date", "startsAtMin", "endsAtMin");

-- CreateIndex
CREATE INDEX "Lesson_roomId_date_startsAtMin_idx" ON "Lesson"("roomId", "date", "startsAtMin");

-- CreateIndex
CREATE INDEX "Lesson_teacherId_date_startsAtMin_idx" ON "Lesson"("teacherId", "date", "startsAtMin");

-- CreateIndex
CREATE INDEX "Lesson_groupId_date_startsAtMin_idx" ON "Lesson"("groupId", "date", "startsAtMin");

-- CreateIndex
CREATE INDEX "Lesson_status_idx" ON "Lesson"("status");

-- CreateIndex
CREATE INDEX "Lesson_batchId_idx" ON "Lesson"("batchId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRole" ADD CONSTRAINT "GroupRole_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AuthGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRole" ADD CONSTRAINT "GroupRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AuthGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EduGroup" ADD CONSTRAINT "EduGroup_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "EduGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityOption" ADD CONSTRAINT "CapabilityOption_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCapability" ADD CONSTRAINT "RoomCapability_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCapability" ADD CONSTRAINT "RoomCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCapability" ADD CONSTRAINT "RoomCapability_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CapabilityOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRule" ADD CONSTRAINT "SubjectCapabilityRule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRule" ADD CONSTRAINT "SubjectCapabilityRule_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRule" ADD CONSTRAINT "SubjectCapabilityRule_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CapabilityOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRuleOption" ADD CONSTRAINT "SubjectCapabilityRuleOption_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "SubjectCapabilityRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRuleOption" ADD CONSTRAINT "SubjectCapabilityRuleOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CapabilityOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAvailability" ADD CONSTRAINT "StaffAvailability_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffException" ADD CONSTRAINT "StaffException_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBatch" ADD CONSTRAINT "LessonBatch_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonEvent" ADD CONSTRAINT "LessonEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LessonBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonEvent" ADD CONSTRAINT "LessonEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "EduGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LessonBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
