-- AlterTable: add discountPercent to membership plans
ALTER TABLE "membership_plans" ADD COLUMN "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable: add membership discount tracking to invoices
ALTER TABLE "invoices" ADD COLUMN "membershipPlanId" INTEGER;
ALTER TABLE "invoices" ADD COLUMN "membershipDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AddForeignKey: invoices -> membership_plans
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "membership_plans"("id") ON DELETE SET NULL;
