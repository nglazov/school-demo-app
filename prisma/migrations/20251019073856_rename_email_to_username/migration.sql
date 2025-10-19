BEGIN;

-- 1️⃣ Переименовать колонку email → username
ALTER TABLE "User" RENAME COLUMN "email" TO "username";

-- 2️⃣ Переименовать уникальный индекс (если существует)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'User_email_key'
  ) THEN
    ALTER INDEX "User_email_key" RENAME TO "User_username_key";
END IF;
END $$;

COMMIT;
