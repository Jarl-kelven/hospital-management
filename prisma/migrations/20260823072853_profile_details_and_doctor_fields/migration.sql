/*
  Warnings:

  - Made the column `hospital` on table `Doctor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `photoUrl` on table `Doctor` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalPatients" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRating" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "hospital" SET NOT NULL,
ALTER COLUMN "photoUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyName" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "gender" "Gender";
