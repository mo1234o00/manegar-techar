/*
  Warnings:

  - Added the required column `stage` to the `AcademicYear` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN     "educationSystem" TEXT,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "stage" TEXT NOT NULL,
ADD COLUMN     "term" TEXT;
