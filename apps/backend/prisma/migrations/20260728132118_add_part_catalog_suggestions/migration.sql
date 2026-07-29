-- CreateEnum
CREATE TYPE "CatalogSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MERGED');

-- CreateTable
CREATE TABLE "PartCatalogSuggestion" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "description" TEXT,
    "oemNumber" TEXT,
    "suggestedCategoryId" TEXT,
    "status" "CatalogSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartCatalogSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartCatalogSuggestion_shopId_idx" ON "PartCatalogSuggestion"("shopId");

-- CreateIndex
CREATE INDEX "PartCatalogSuggestion_createdById_idx" ON "PartCatalogSuggestion"("createdById");

-- CreateIndex
CREATE INDEX "PartCatalogSuggestion_status_idx" ON "PartCatalogSuggestion"("status");

-- CreateIndex
CREATE INDEX "PartCatalogSuggestion_suggestedCategoryId_idx" ON "PartCatalogSuggestion"("suggestedCategoryId");

-- CreateIndex
CREATE INDEX "PartCatalogSuggestion_resolvedById_idx" ON "PartCatalogSuggestion"("resolvedById");

-- CreateIndex
CREATE INDEX "PartCatalogSuggestion_mergedIntoId_idx" ON "PartCatalogSuggestion"("mergedIntoId");

-- CreateIndex
CREATE INDEX "PartCatalogSuggestion_normalizedName_idx" ON "PartCatalogSuggestion"("normalizedName");

-- AddForeignKey
ALTER TABLE "PartCatalogSuggestion" ADD CONSTRAINT "PartCatalogSuggestion_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCatalogSuggestion" ADD CONSTRAINT "PartCatalogSuggestion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCatalogSuggestion" ADD CONSTRAINT "PartCatalogSuggestion_suggestedCategoryId_fkey" FOREIGN KEY ("suggestedCategoryId") REFERENCES "PartCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCatalogSuggestion" ADD CONSTRAINT "PartCatalogSuggestion_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCatalogSuggestion" ADD CONSTRAINT "PartCatalogSuggestion_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "PartCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
