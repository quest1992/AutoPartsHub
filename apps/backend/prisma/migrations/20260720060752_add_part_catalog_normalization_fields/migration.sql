-- AlterTable
ALTER TABLE "PartCatalogItem" ADD COLUMN     "normalizedName" TEXT,
ADD COLUMN     "searchTokens" TEXT;

-- CreateIndex
CREATE INDEX "PartCatalogItem_normalizedName_idx" ON "PartCatalogItem"("normalizedName");

-- CreateIndex
CREATE INDEX "PartCatalogItem_categoryId_side_position_normalizedName_idx" ON "PartCatalogItem"("categoryId", "side", "position", "normalizedName");
