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
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "person_id" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "birth_date" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "AuthGroup" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRole" (
    "group_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "GroupRole_pkey" PRIMARY KEY ("group_id","role_id")
);

-- CreateTable
CREATE TABLE "UserGroup" (
    "user_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("user_id","group_id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "external_id" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "type" "GuardianType" NOT NULL DEFAULT 'PARENT',

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Family" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" SERIAL NOT NULL,
    "family_id" INTEGER NOT NULL,
    "role" "FamilyMemberRole" NOT NULL,
    "student_id" INTEGER,
    "guardian_id" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "starts_on" TIMESTAMP(3) NOT NULL,
    "ends_on" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EduGroup" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade_level" INTEGER,
    "academic_year_id" INTEGER NOT NULL,
    "track" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EduGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "until" TIMESTAMP(3),

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "building_id" INTEGER NOT NULL,
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
    "value_type" "CapabilityValueType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapabilityOption" (
    "id" SERIAL NOT NULL,
    "capability_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CapabilityOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomCapability" (
    "room_id" INTEGER NOT NULL,
    "capability_id" INTEGER NOT NULL,
    "bool_value" BOOLEAN,
    "int_value" INTEGER,
    "text_value" TEXT,
    "option_id" INTEGER,

    CONSTRAINT "RoomCapability_pkey" PRIMARY KEY ("room_id","capability_id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectCapabilityRule" (
    "id" SERIAL NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "capability_id" INTEGER NOT NULL,
    "operator" "CapabilityOperator" NOT NULL,
    "bool_value" BOOLEAN,
    "int_value" INTEGER,
    "text_value" TEXT,
    "option_id" INTEGER,

    CONSTRAINT "SubjectCapabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectCapabilityRuleOption" (
    "rule_id" INTEGER NOT NULL,
    "option_id" INTEGER NOT NULL,

    CONSTRAINT "SubjectCapabilityRuleOption_pkey" PRIMARY KEY ("rule_id","option_id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "type" "StaffType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAvailability" (
    "id" SERIAL NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "starts_at_min" INTEGER NOT NULL,
    "ends_at_min" INTEGER NOT NULL,
    "interval_weeks" INTEGER NOT NULL DEFAULT 1,
    "week_offset" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),

    CONSTRAINT "StaffAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffException" (
    "id" SERIAL NOT NULL,
    "staff_id" INTEGER NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "LessonBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonEvent" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "type" "LessonEventType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "message" TEXT,

    CONSTRAINT "LessonEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "starts_at_min" INTEGER NOT NULL,
    "ends_at_min" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "room_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "status" "LessonStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_person_id_key" ON "User"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AuthGroup_key_key" ON "AuthGroup"("key");

-- CreateIndex
CREATE INDEX "UserGroup_group_id_idx" ON "UserGroup"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_person_id_key" ON "Student"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_person_id_key" ON "Guardian"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "Family_key_key" ON "Family"("key");

-- CreateIndex
CREATE INDEX "FamilyMember_family_id_idx" ON "FamilyMember"("family_id");

-- CreateIndex
CREATE INDEX "FamilyMember_student_id_idx" ON "FamilyMember"("student_id");

-- CreateIndex
CREATE INDEX "FamilyMember_guardian_id_idx" ON "FamilyMember"("guardian_id");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_code_key" ON "AcademicYear"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EduGroup_key_key" ON "EduGroup"("key");

-- CreateIndex
CREATE INDEX "EduGroup_academic_year_id_idx" ON "EduGroup"("academic_year_id");

-- CreateIndex
CREATE INDEX "GroupMembership_group_id_idx" ON "GroupMembership"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_student_id_group_id_since_key" ON "GroupMembership"("student_id", "group_id", "since");

-- CreateIndex
CREATE INDEX "Room_building_id_idx" ON "Room"("building_id");

-- CreateIndex
CREATE UNIQUE INDEX "Room_building_id_name_key" ON "Room"("building_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Capability_key_key" ON "Capability"("key");

-- CreateIndex
CREATE INDEX "CapabilityOption_capability_id_idx" ON "CapabilityOption"("capability_id");

-- CreateIndex
CREATE UNIQUE INDEX "CapabilityOption_capability_id_key_key" ON "CapabilityOption"("capability_id", "key");

-- CreateIndex
CREATE INDEX "RoomCapability_capability_id_idx" ON "RoomCapability"("capability_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "SubjectCapabilityRule_capability_id_idx" ON "SubjectCapabilityRule"("capability_id");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectCapabilityRule_subject_id_capability_id_operator_key" ON "SubjectCapabilityRule"("subject_id", "capability_id", "operator");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_person_id_key" ON "Staff"("person_id");

-- CreateIndex
CREATE INDEX "StaffAvailability_staff_id_weekday_idx" ON "StaffAvailability"("staff_id", "weekday");

-- CreateIndex
CREATE INDEX "StaffException_staff_id_date_idx" ON "StaffException"("staff_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StaffException_staff_id_date_key" ON "StaffException"("staff_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LessonBatch_key_key" ON "LessonBatch"("key");

-- CreateIndex
CREATE INDEX "LessonBatch_key_idx" ON "LessonBatch"("key");

-- CreateIndex
CREATE INDEX "LessonBatch_created_at_idx" ON "LessonBatch"("created_at");

-- CreateIndex
CREATE INDEX "LessonEvent_batch_id_idx" ON "LessonEvent"("batch_id");

-- CreateIndex
CREATE INDEX "LessonEvent_created_at_idx" ON "LessonEvent"("created_at");

-- CreateIndex
CREATE INDEX "LessonEvent_type_idx" ON "LessonEvent"("type");

-- CreateIndex
CREATE INDEX "Lesson_date_starts_at_min_ends_at_min_idx" ON "Lesson"("date", "starts_at_min", "ends_at_min");

-- CreateIndex
CREATE INDEX "Lesson_room_id_date_starts_at_min_idx" ON "Lesson"("room_id", "date", "starts_at_min");

-- CreateIndex
CREATE INDEX "Lesson_teacher_id_date_starts_at_min_idx" ON "Lesson"("teacher_id", "date", "starts_at_min");

-- CreateIndex
CREATE INDEX "Lesson_group_id_date_starts_at_min_idx" ON "Lesson"("group_id", "date", "starts_at_min");

-- CreateIndex
CREATE INDEX "Lesson_status_idx" ON "Lesson"("status");

-- CreateIndex
CREATE INDEX "Lesson_batch_id_idx" ON "Lesson"("batch_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRole" ADD CONSTRAINT "GroupRole_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "AuthGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRole" ADD CONSTRAINT "GroupRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "AuthGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EduGroup" ADD CONSTRAINT "EduGroup_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "EduGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapabilityOption" ADD CONSTRAINT "CapabilityOption_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCapability" ADD CONSTRAINT "RoomCapability_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCapability" ADD CONSTRAINT "RoomCapability_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomCapability" ADD CONSTRAINT "RoomCapability_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "CapabilityOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRule" ADD CONSTRAINT "SubjectCapabilityRule_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRule" ADD CONSTRAINT "SubjectCapabilityRule_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRule" ADD CONSTRAINT "SubjectCapabilityRule_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "CapabilityOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRuleOption" ADD CONSTRAINT "SubjectCapabilityRuleOption_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "SubjectCapabilityRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectCapabilityRuleOption" ADD CONSTRAINT "SubjectCapabilityRuleOption_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "CapabilityOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAvailability" ADD CONSTRAINT "StaffAvailability_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffException" ADD CONSTRAINT "StaffException_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonBatch" ADD CONSTRAINT "LessonBatch_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonEvent" ADD CONSTRAINT "LessonEvent_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "LessonBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonEvent" ADD CONSTRAINT "LessonEvent_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "EduGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "LessonBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
