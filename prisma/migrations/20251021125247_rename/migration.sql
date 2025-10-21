-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "staffId" INTEGER;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
