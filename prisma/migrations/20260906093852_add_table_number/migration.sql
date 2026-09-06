/*
  Warnings:

  - A unique constraint covering the columns `[restaurantId,tableNumber]` on the table `tables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tableNumber` to the `tables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "tableNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tables_restaurantId_tableNumber_key" ON "tables"("restaurantId", "tableNumber");
