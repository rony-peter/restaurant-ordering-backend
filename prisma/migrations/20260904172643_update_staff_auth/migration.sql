/*
  Warnings:

  - You are about to drop the column `credentials` on the `staff` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[restaurantId,email]` on the table `staff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "staff" DROP COLUMN "credentials",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "staff_restaurantId_email_key" ON "staff"("restaurantId", "email");
