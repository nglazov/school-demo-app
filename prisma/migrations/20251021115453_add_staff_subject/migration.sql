-- CreateTable
CREATE TABLE "StaffSubject" (
    "staffId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "StaffSubject_pkey" PRIMARY KEY ("staffId","subjectId")
);

-- CreateIndex
CREATE INDEX "StaffSubject_subjectId_idx" ON "StaffSubject"("subjectId");

-- AddForeignKey
ALTER TABLE "StaffSubject" ADD CONSTRAINT "StaffSubject_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubject" ADD CONSTRAINT "StaffSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
