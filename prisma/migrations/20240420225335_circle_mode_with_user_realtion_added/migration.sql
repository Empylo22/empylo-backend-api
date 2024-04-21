/*
  Warnings:

  - You are about to drop the column `createdDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastModifiedDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ActivationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OtpObject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ResetToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActivationToken" DROP CONSTRAINT "ActivationToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "OtpObject" DROP CONSTRAINT "OtpObject_userId_fkey";

-- DropForeignKey
ALTER TABLE "ResetToken" DROP CONSTRAINT "ResetToken_userId_fkey";

-- DropIndex
DROP INDEX "User_passwordResetCode_key";

-- DropIndex
DROP INDEX "User_verificationCode_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdDate",
DROP COLUMN "isActive",
DROP COLUMN "lastModifiedDate",
DROP COLUMN "passwordResetCode",
DROP COLUMN "verificationCode";

-- DropTable
DROP TABLE "ActivationToken";

-- DropTable
DROP TABLE "OtpObject";

-- DropTable
DROP TABLE "ResetToken";

-- CreateTable
CREATE TABLE "Circle" (
    "id" SERIAL NOT NULL,
    "circleName" TEXT NOT NULL,
    "circleDescription" TEXT,
    "circleShareLink" TEXT NOT NULL,
    "wellbeingScore" DOUBLE PRECISION,
    "activityLevel" TEXT,
    "circleStatus" TEXT,
    "circleNos" INTEGER,
    "circleImg" TEXT,
    "circleScoreDetail" TEXT,
    "companyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CircleMembers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Circle_circleShareLink_key" ON "Circle"("circleShareLink");

-- CreateIndex
CREATE UNIQUE INDEX "_CircleMembers_AB_unique" ON "_CircleMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_CircleMembers_B_index" ON "_CircleMembers"("B");

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CircleMembers" ADD CONSTRAINT "_CircleMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CircleMembers" ADD CONSTRAINT "_CircleMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
