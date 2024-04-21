/*
  Warnings:

  - You are about to drop the column `companyId` on the `Circle` table. All the data in the column will be lost.
  - Added the required column `circleOwncerId` to the `Circle` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Circle" DROP CONSTRAINT "Circle_companyId_fkey";

-- AlterTable
ALTER TABLE "Circle" DROP COLUMN "companyId",
ADD COLUMN     "circleOwncerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_circleOwncerId_fkey" FOREIGN KEY ("circleOwncerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
