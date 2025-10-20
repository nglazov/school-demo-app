-- AlterTable
CREATE SEQUENCE usergroup_id_seq;
ALTER TABLE "UserGroup" ALTER COLUMN "id" SET DEFAULT nextval('usergroup_id_seq');
ALTER SEQUENCE usergroup_id_seq OWNED BY "UserGroup"."id";
