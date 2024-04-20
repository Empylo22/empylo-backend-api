/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `TokenManager` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TokenManager_token_key" ON "TokenManager"("token");
