-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAY_AT_TABLE', 'ONLINE');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "method" "PaymentMethod" NOT NULL DEFAULT 'PAY_AT_TABLE';
