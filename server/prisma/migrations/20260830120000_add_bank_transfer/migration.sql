-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "bankReference" TEXT;
ALTER TABLE "invoices" ADD COLUMN "bankName" TEXT;
