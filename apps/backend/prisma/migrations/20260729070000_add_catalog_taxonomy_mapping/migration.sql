CREATE TYPE "PartCategoryClassification" AS ENUM (
  'CATEGORY',
  'CATALOG_ITEM',
  'INVALID',
  'REVIEW'
);

ALTER TABLE "PartCatalogItem"
ADD COLUMN "replacedById" TEXT;

CREATE TABLE "PartCategoryCatalogItemMapping" (
  "id" TEXT NOT NULL,
  "sourceCategoryId" TEXT NOT NULL,
  "targetCatalogItemId" TEXT,
  "migrationKey" TEXT NOT NULL,
  "classification" "PartCategoryClassification" NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartCategoryCatalogItemMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartCategoryCatalogItemMapping_migrationKey_key"
ON "PartCategoryCatalogItemMapping"("migrationKey");
CREATE UNIQUE INDEX "PartCategoryCatalogItemMapping_sourceCategoryId_targetCatalogItemId_key"
ON "PartCategoryCatalogItemMapping"("sourceCategoryId", "targetCatalogItemId");
CREATE INDEX "PartCategoryCatalogItemMapping_sourceCategoryId_idx"
ON "PartCategoryCatalogItemMapping"("sourceCategoryId");
CREATE INDEX "PartCategoryCatalogItemMapping_targetCatalogItemId_idx"
ON "PartCategoryCatalogItemMapping"("targetCatalogItemId");
CREATE INDEX "PartCategoryCatalogItemMapping_classification_idx"
ON "PartCategoryCatalogItemMapping"("classification");
CREATE INDEX "PartCategoryCatalogItemMapping_createdById_idx"
ON "PartCategoryCatalogItemMapping"("createdById");
CREATE INDEX "PartCatalogItem_replacedById_idx"
ON "PartCatalogItem"("replacedById");

ALTER TABLE "PartCategoryCatalogItemMapping"
ADD CONSTRAINT "PartCategoryCatalogItemMapping_sourceCategoryId_fkey"
FOREIGN KEY ("sourceCategoryId") REFERENCES "PartCategory"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartCategoryCatalogItemMapping"
ADD CONSTRAINT "PartCategoryCatalogItemMapping_targetCatalogItemId_fkey"
FOREIGN KEY ("targetCatalogItemId") REFERENCES "PartCatalogItem"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartCategoryCatalogItemMapping"
ADD CONSTRAINT "PartCategoryCatalogItemMapping_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PartCatalogItem"
ADD CONSTRAINT "PartCatalogItem_replacedById_fkey"
FOREIGN KEY ("replacedById") REFERENCES "PartCatalogItem"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PartCatalogItem"
ADD CONSTRAINT "PartCatalogItem_replacedBy_not_self"
CHECK ("replacedById" IS NULL OR "replacedById" <> "id");
