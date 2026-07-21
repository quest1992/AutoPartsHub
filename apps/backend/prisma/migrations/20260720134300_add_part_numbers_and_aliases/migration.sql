-- CreateEnum
CREATE TYPE "PartNumberType" AS ENUM ('OEM', 'CROSS', 'AFTERMARKET', 'INTERNAL');

-- CreateTable
CREATE TABLE "PartNumber" (
    "id" TEXT NOT NULL,
    "partCatalogItemId" TEXT NOT NULL,
    "rawNumber" TEXT NOT NULL,
    "normalizedNumber" TEXT NOT NULL,
    "type" "PartNumberType" NOT NULL,
    "brand" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartAlias" (
    "id" TEXT NOT NULL,
    "partCatalogItemId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "source" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartNumber_normalizedNumber_idx" ON "PartNumber"("normalizedNumber");

-- CreateIndex
CREATE INDEX "PartNumber_partCatalogItemId_idx" ON "PartNumber"("partCatalogItemId");

-- CreateIndex
CREATE INDEX "PartNumber_type_idx" ON "PartNumber"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PartNumber_partCatalogItemId_normalizedNumber_type_key" ON "PartNumber"("partCatalogItemId", "normalizedNumber", "type");

-- CreateIndex
CREATE INDEX "PartAlias_normalizedAlias_idx" ON "PartAlias"("normalizedAlias");

-- CreateIndex
CREATE INDEX "PartAlias_partCatalogItemId_idx" ON "PartAlias"("partCatalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PartAlias_partCatalogItemId_normalizedAlias_key" ON "PartAlias"("partCatalogItemId", "normalizedAlias");

-- AddForeignKey
ALTER TABLE "PartNumber" ADD CONSTRAINT "PartNumber_partCatalogItemId_fkey" FOREIGN KEY ("partCatalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartAlias" ADD CONSTRAINT "PartAlias_partCatalogItemId_fkey" FOREIGN KEY ("partCatalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
