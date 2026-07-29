CREATE TYPE "OrderCommissionType" AS ENUM ('MARKUP', 'PERCENT', 'FIXED', 'MANUAL');
CREATE TYPE "ShopCommissionType" AS ENUM ('MARKUP', 'PERCENT', 'FIXED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_WALLET', 'OTHER');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "ShopPayableStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
CREATE TYPE "PayoutMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'OTHER');
CREATE TYPE "ShopPayoutStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

ALTER TABLE "CustomerOrder"
  ADD COLUMN "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN "platformProductRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN "platformDeliveryRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0;

ALTER TABLE "CustomerOrderItem"
  ADD COLUMN "shopUnitPrice" DECIMAL(14,2),
  ADD COLUMN "clientUnitPrice" DECIMAL(14,2),
  ADD COLUMN "grossAmount" DECIMAL(14,2),
  ADD COLUMN "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN "clientAmount" DECIMAL(14,2),
  ADD COLUMN "shopAmount" DECIMAL(14,2),
  ADD COLUMN "platformRevenue" DECIMAL(14,2),
  ADD COLUMN "commissionType" "OrderCommissionType" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "commissionValue" DECIMAL(14,2) NOT NULL DEFAULT 0;

UPDATE "CustomerOrderItem"
SET
  "shopUnitPrice" = "unitPrice",
  "clientUnitPrice" = "unitPrice",
  "grossAmount" = "total",
  "clientAmount" = "total",
  "shopAmount" = "total",
  "platformRevenue" = 0;

ALTER TABLE "CustomerOrderItem"
  ALTER COLUMN "shopUnitPrice" SET NOT NULL,
  ALTER COLUMN "clientUnitPrice" SET NOT NULL,
  ALTER COLUMN "grossAmount" SET NOT NULL,
  ALTER COLUMN "clientAmount" SET NOT NULL,
  ALTER COLUMN "shopAmount" SET NOT NULL,
  ALTER COLUMN "platformRevenue" SET NOT NULL;

CREATE TABLE "ShopCommissionSetting" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "commissionType" "ShopCommissionType" NOT NULL,
  "commissionValue" DECIMAL(14,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShopCommissionSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformOrderSetting" (
  "id" TEXT NOT NULL,
  "defaultCommissionType" "ShopCommissionType" NOT NULL,
  "defaultCommissionValue" DECIMAL(14,2) NOT NULL,
  "reservationMinutes" INTEGER NOT NULL DEFAULT 120,
  "currencyCode" TEXT NOT NULL DEFAULT 'TJS',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformOrderSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerOrderPayment" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "originalPaymentId" TEXT,
  "transactionReference" TEXT,
  "note" TEXT,
  "receivedById" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "cancelledAt" TIMESTAMP(3),
  "cancelledById" TEXT,
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerOrderPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerOrderPayment_amount_positive" CHECK ("amount" > 0)
);

CREATE TABLE "ShopPayable" (
  "id" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "customerOrderId" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "grossShopAmount" DECIMAL(14,2) NOT NULL,
  "adjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "payableAmount" DECIMAL(14,2) NOT NULL,
  "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status" "ShopPayableStatus" NOT NULL DEFAULT 'PENDING',
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShopPayable_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShopPayable_amounts_valid" CHECK ("payableAmount" >= 0 AND "paidAmount" >= 0 AND "paidAmount" <= "payableAmount")
);

CREATE TABLE "ShopPayout" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "shopId" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "method" "PayoutMethod" NOT NULL,
  "status" "ShopPayoutStatus" NOT NULL DEFAULT 'DRAFT',
  "transactionReference" TEXT,
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "paidAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "cancelledById" TEXT,
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ShopPayout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShopPayout_amount_positive" CHECK ("amount" > 0)
);

CREATE TABLE "ShopPayoutAllocation" (
  "id" TEXT NOT NULL,
  "payoutId" TEXT NOT NULL,
  "payableId" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  CONSTRAINT "ShopPayoutAllocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShopPayoutAllocation_amount_positive" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "ShopCommissionSetting_shopId_key" ON "ShopCommissionSetting"("shopId");
CREATE INDEX "CustomerOrderPayment_orderId_status_idx" ON "CustomerOrderPayment"("orderId", "status");
CREATE INDEX "CustomerOrderPayment_receivedAt_idx" ON "CustomerOrderPayment"("receivedAt");
CREATE INDEX "CustomerOrderPayment_originalPaymentId_idx" ON "CustomerOrderPayment"("originalPaymentId");
CREATE UNIQUE INDEX "ShopPayable_saleId_key" ON "ShopPayable"("saleId");
CREATE INDEX "ShopPayable_shopId_status_idx" ON "ShopPayable"("shopId", "status");
CREATE INDEX "ShopPayable_customerOrderId_idx" ON "ShopPayable"("customerOrderId");
CREATE UNIQUE INDEX "ShopPayout_number_key" ON "ShopPayout"("number");
CREATE INDEX "ShopPayout_shopId_status_idx" ON "ShopPayout"("shopId", "status");
CREATE UNIQUE INDEX "ShopPayoutAllocation_payoutId_payableId_key" ON "ShopPayoutAllocation"("payoutId", "payableId");
CREATE INDEX "ShopPayoutAllocation_payableId_idx" ON "ShopPayoutAllocation"("payableId");

ALTER TABLE "ShopCommissionSetting" ADD CONSTRAINT "ShopCommissionSetting_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerOrderPayment" ADD CONSTRAINT "CustomerOrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerOrderPayment" ADD CONSTRAINT "CustomerOrderPayment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerOrderPayment" ADD CONSTRAINT "CustomerOrderPayment_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerOrderPayment" ADD CONSTRAINT "CustomerOrderPayment_originalPaymentId_fkey" FOREIGN KEY ("originalPaymentId") REFERENCES "CustomerOrderPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopPayable" ADD CONSTRAINT "ShopPayable_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopPayable" ADD CONSTRAINT "ShopPayable_customerOrderId_fkey" FOREIGN KEY ("customerOrderId") REFERENCES "CustomerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopPayable" ADD CONSTRAINT "ShopPayable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopPayout" ADD CONSTRAINT "ShopPayout_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopPayout" ADD CONSTRAINT "ShopPayout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopPayout" ADD CONSTRAINT "ShopPayout_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShopPayoutAllocation" ADD CONSTRAINT "ShopPayoutAllocation_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "ShopPayout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopPayoutAllocation" ADD CONSTRAINT "ShopPayoutAllocation_payableId_fkey" FOREIGN KEY ("payableId") REFERENCES "ShopPayable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "PlatformOrderSetting" ("id", "defaultCommissionType", "defaultCommissionValue", "reservationMinutes", "currencyCode", "isActive", "updatedAt")
SELECT gen_random_uuid()::text, 'MARKUP', 0, 120, 'TJS', true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "PlatformOrderSetting" WHERE "isActive" = true);

INSERT INTO "ShopPayable" ("id", "shopId", "customerOrderId", "saleId", "grossShopAmount", "payableAmount", "paidAmount", "status", "updatedAt")
SELECT gen_random_uuid()::text, s."shopId", s."customerOrderId", s."id", s."totalAmount", s."totalAmount", 0, 'PENDING', CURRENT_TIMESTAMP
FROM "Sale" s
JOIN "CustomerOrder" o ON o."id" = s."customerOrderId"
WHERE s."customerOrderId" IS NOT NULL
  AND s."status" <> 'CANCELLED'
  AND o."status" IN ('CONFIRMED', 'READY', 'COMPLETED')
  AND NOT EXISTS (SELECT 1 FROM "ShopPayable" p WHERE p."saleId" = s."id");
