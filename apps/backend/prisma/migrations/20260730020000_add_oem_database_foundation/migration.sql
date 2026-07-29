-- Additive OEM engine. Existing rows remain valid; inventory links are nullable.
CREATE TYPE "OemPartStatus" AS ENUM ('ACTIVE','DISCONTINUED','SUPERSEDED','UNKNOWN');
CREATE TYPE "OemPartAliasType" AS ENUM ('FORMATTING','OLD_NUMBER','REPLACED_NUMBER','SUPERSESSION','REGIONAL','SUPPLIER','MANUAL');
CREATE TYPE "OemSourceType" AS ENUM ('OPEN_DATA','MANUFACTURER','SUPPLIER','SHOP','MANUAL_ENTRY','CSV_IMPORT','API','COMMERCIAL_LICENSE','UNKNOWN');
CREATE TYPE "OemPartBrandRelationType" AS ENUM ('VEHICLE_MANUFACTURER','ORIGINAL_SUPPLIER','OES','AFTERMARKET','PACKAGING_BRAND','UNKNOWN');
CREATE TYPE "OemFitmentPosition" AS ENUM ('FRONT','REAR','LEFT','RIGHT','FRONT_LEFT','FRONT_RIGHT','REAR_LEFT','REAR_RIGHT','INNER','OUTER','UPPER','LOWER','CENTER','NOT_APPLICABLE','UNKNOWN');
CREATE TYPE "OemCrossReferenceType" AS ENUM ('REPLACEMENT','SUPERSESSION','PREDECESSOR','SUCCESSOR','INTERCHANGE','AFTERMARKET_ANALOG','OES_EQUIVALENT','POSSIBLE_MATCH');
CREATE TYPE "OemImportBatchStatus" AS ENUM ('PLANNED','RUNNING','COMPLETED','FAILED','CANCELLED');
CREATE TYPE "OemContributionType" AS ENUM ('NEW_OEM','NEW_ALIAS','CATEGORY_MAPPING','FITMENT','CROSS_REFERENCE','CORRECTION');
CREATE TYPE "OemContributionStatus" AS ENUM ('PENDING','APPROVED','REJECTED','DUPLICATE');

CREATE TABLE "OemSource" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "url" TEXT NOT NULL,
  "sourceType" "OemSourceType" NOT NULL, "license" TEXT NOT NULL,
  "licenseUrl" TEXT, "usageNotes" TEXT, "isCommercial" BOOLEAN NOT NULL DEFAULT false,
  "isRedistributable" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "retrievedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "OemSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OemPart" (
  "id" TEXT NOT NULL, "number" TEXT NOT NULL, "normalizedNumber" TEXT NOT NULL,
  "displayNumber" TEXT NOT NULL, "description" TEXT, "descriptionNormalized" TEXT,
  "status" "OemPartStatus" NOT NULL DEFAULT 'UNKNOWN', "metadata" JSONB NOT NULL DEFAULT '{}',
  "manufacturerId" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "sourceKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OemPart_pkey" PRIMARY KEY ("id")
);
INSERT INTO "OemSource" (
  "id","name","url","sourceType","license","usageNotes",
  "isCommercial","isRedistributable","isActive","retrievedAt","createdAt","updatedAt"
) VALUES
  ('oem-source-manual-platform','Manual entry by platform operator','internal://manual-entry',
   'MANUAL_ENTRY','Internal platform data','SUPER_ADMIN reviewed manual entry',
   false,false,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('oem-source-shop-inventory','Shop-provided inventory data','internal://shop-inventory',
   'SHOP','Shop-provided data','Must pass contribution moderation before global use',
   false,false,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
CREATE TABLE "OemPartAlias" (
  "id" TEXT NOT NULL, "oemPartId" TEXT NOT NULL, "alias" TEXT NOT NULL,
  "normalizedAlias" TEXT NOT NULL, "aliasType" "OemPartAliasType" NOT NULL,
  "sourceId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OemPartAlias_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OemPartCategory" (
  "id" TEXT NOT NULL, "oemPartId" TEXT NOT NULL, "catalogItemId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false, "confidence" INTEGER NOT NULL,
  "sourceId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OemPartCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OemPartCategory_confidence_check" CHECK ("confidence" BETWEEN 0 AND 100)
);
CREATE TABLE "OemPartBrand" (
  "id" TEXT NOT NULL, "oemPartId" TEXT NOT NULL, "partBrandId" TEXT NOT NULL,
  "relationType" "OemPartBrandRelationType" NOT NULL, "confidence" INTEGER NOT NULL,
  "sourceId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OemPartBrand_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OemPartBrand_confidence_check" CHECK ("confidence" BETWEEN 0 AND 100)
);
CREATE TABLE "OemPartFitment" (
  "id" TEXT NOT NULL, "oemPartId" TEXT NOT NULL, "manufacturerId" TEXT NOT NULL,
  "vehicleModelId" TEXT, "vehicleGenerationId" TEXT, "vehicleSpecificationId" TEXT,
  "yearFrom" INTEGER, "yearTo" INTEGER, "position" "OemFitmentPosition" NOT NULL DEFAULT 'UNKNOWN',
  "side" "PartSide" NOT NULL DEFAULT 'NONE', "bodyType" TEXT, "engineCode" TEXT, "motorCode" TEXT,
  "driveType" TEXT, "notes" TEXT, "confidence" INTEGER NOT NULL, "sourceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OemPartFitment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OemPartFitment_confidence_check" CHECK ("confidence" BETWEEN 0 AND 100),
  CONSTRAINT "OemPartFitment_years_check" CHECK ("yearFrom" IS NULL OR "yearTo" IS NULL OR "yearFrom" <= "yearTo")
);
CREATE TABLE "OemCrossReference" (
  "id" TEXT NOT NULL, "fromOemPartId" TEXT NOT NULL, "toOemPartId" TEXT,
  "partBrandId" TEXT, "externalPartNumber" TEXT, "normalizedExternalPartNumber" TEXT,
  "relationType" "OemCrossReferenceType" NOT NULL, "confidence" INTEGER NOT NULL,
  "sourceId" TEXT NOT NULL, "notes" TEXT, "fingerprint" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OemCrossReference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OemCrossReference_confidence_check" CHECK ("confidence" BETWEEN 0 AND 100),
  CONSTRAINT "OemCrossReference_not_self_check" CHECK ("toOemPartId" IS NULL OR "toOemPartId" <> "fromOemPartId"),
  CONSTRAINT "OemCrossReference_target_check" CHECK (
    "toOemPartId" IS NOT NULL OR
    ("partBrandId" IS NOT NULL AND NULLIF("normalizedExternalPartNumber", '') IS NOT NULL)
  )
);
CREATE TABLE "OemImportBatch" (
  "id" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "fileName" TEXT NOT NULL, "checksum" TEXT NOT NULL,
  "status" "OemImportBatchStatus" NOT NULL, "totalRows" INTEGER NOT NULL DEFAULT 0,
  "validRows" INTEGER NOT NULL DEFAULT 0, "invalidRows" INTEGER NOT NULL DEFAULT 0,
  "createdRows" INTEGER NOT NULL DEFAULT 0, "updatedRows" INTEGER NOT NULL DEFAULT 0,
  "skippedRows" INTEGER NOT NULL DEFAULT 0, "errorRows" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "reportJson" JSONB NOT NULL,
  "createdById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "OemImportBatch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OemContribution" (
  "id" TEXT NOT NULL, "shopId" TEXT NOT NULL, "submittedById" TEXT NOT NULL,
  "type" "OemContributionType" NOT NULL, "payloadJson" JSONB NOT NULL,
  "status" "OemContributionStatus" NOT NULL DEFAULT 'PENDING', "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3), "reviewComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OemContribution_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OemAuditLog" (
  "id" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL, "beforeJson" JSONB, "afterJson" JSONB, "actorId" TEXT,
  "source" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OemAuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ShopInventoryItem" ADD COLUMN "oemPartId" TEXT,
  ADD COLUMN "partBrandId" TEXT, ADD COLUMN "externalPartNumber" TEXT,
  ADD COLUMN "normalizedExternalPartNumber" TEXT;

CREATE UNIQUE INDEX "OemSource_name_url_key" ON "OemSource"("name","url");
CREATE INDEX "OemSource_sourceType_idx" ON "OemSource"("sourceType");
CREATE INDEX "OemSource_isRedistributable_isActive_idx" ON "OemSource"("isRedistributable","isActive");
CREATE UNIQUE INDEX "OemPart_manufacturerId_normalizedNumber_key" ON "OemPart"("manufacturerId","normalizedNumber");
CREATE UNIQUE INDEX "OemPart_sourceId_sourceKey_key" ON "OemPart"("sourceId","sourceKey");
CREATE INDEX "OemPart_normalizedNumber_idx" ON "OemPart"("normalizedNumber");
CREATE INDEX "OemPart_manufacturerId_idx" ON "OemPart"("manufacturerId");
CREATE INDEX "OemPart_sourceId_idx" ON "OemPart"("sourceId");
CREATE INDEX "OemPart_status_idx" ON "OemPart"("status");
CREATE UNIQUE INDEX "OemPartAlias_oemPartId_alias_key" ON "OemPartAlias"("oemPartId","alias");
CREATE INDEX "OemPartAlias_oemPartId_idx" ON "OemPartAlias"("oemPartId");
CREATE INDEX "OemPartAlias_normalizedAlias_idx" ON "OemPartAlias"("normalizedAlias");
CREATE INDEX "OemPartAlias_sourceId_idx" ON "OemPartAlias"("sourceId");
CREATE UNIQUE INDEX "OemPartCategory_oemPartId_catalogItemId_key" ON "OemPartCategory"("oemPartId","catalogItemId");
CREATE UNIQUE INDEX "OemPartCategory_one_primary_idx" ON "OemPartCategory"("oemPartId") WHERE "isPrimary" = true;
CREATE INDEX "OemPartCategory_oemPartId_idx" ON "OemPartCategory"("oemPartId");
CREATE INDEX "OemPartCategory_catalogItemId_idx" ON "OemPartCategory"("catalogItemId");
CREATE INDEX "OemPartCategory_sourceId_idx" ON "OemPartCategory"("sourceId");
CREATE UNIQUE INDEX "OemPartBrand_oemPartId_partBrandId_relationType_key" ON "OemPartBrand"("oemPartId","partBrandId","relationType");
CREATE INDEX "OemPartBrand_oemPartId_idx" ON "OemPartBrand"("oemPartId");
CREATE INDEX "OemPartBrand_partBrandId_idx" ON "OemPartBrand"("partBrandId");
CREATE INDEX "OemPartBrand_sourceId_idx" ON "OemPartBrand"("sourceId");
CREATE INDEX "OemPartFitment_oemPartId_idx" ON "OemPartFitment"("oemPartId");
CREATE INDEX "OemPartFitment_manufacturerId_idx" ON "OemPartFitment"("manufacturerId");
CREATE INDEX "OemPartFitment_vehicleModelId_idx" ON "OemPartFitment"("vehicleModelId");
CREATE INDEX "OemPartFitment_vehicleGenerationId_idx" ON "OemPartFitment"("vehicleGenerationId");
CREATE INDEX "OemPartFitment_vehicleSpecificationId_idx" ON "OemPartFitment"("vehicleSpecificationId");
CREATE INDEX "OemPartFitment_sourceId_idx" ON "OemPartFitment"("sourceId");
CREATE UNIQUE INDEX "OemCrossReference_fingerprint_key" ON "OemCrossReference"("fingerprint");
CREATE INDEX "OemCrossReference_fromOemPartId_idx" ON "OemCrossReference"("fromOemPartId");
CREATE INDEX "OemCrossReference_toOemPartId_idx" ON "OemCrossReference"("toOemPartId");
CREATE INDEX "OemCrossReference_partBrandId_idx" ON "OemCrossReference"("partBrandId");
CREATE INDEX "OemCrossReference_normalizedExternalPartNumber_idx" ON "OemCrossReference"("normalizedExternalPartNumber");
CREATE INDEX "OemCrossReference_relationType_idx" ON "OemCrossReference"("relationType");
CREATE INDEX "OemCrossReference_sourceId_idx" ON "OemCrossReference"("sourceId");
CREATE UNIQUE INDEX "OemImportBatch_checksum_sourceId_key" ON "OemImportBatch"("checksum","sourceId");
CREATE INDEX "OemImportBatch_sourceId_idx" ON "OemImportBatch"("sourceId");
CREATE INDEX "OemImportBatch_status_idx" ON "OemImportBatch"("status");
CREATE INDEX "OemImportBatch_createdById_idx" ON "OemImportBatch"("createdById");
CREATE INDEX "OemContribution_shopId_status_idx" ON "OemContribution"("shopId","status");
CREATE INDEX "OemContribution_submittedById_idx" ON "OemContribution"("submittedById");
CREATE INDEX "OemContribution_reviewedById_idx" ON "OemContribution"("reviewedById");
CREATE INDEX "OemContribution_type_idx" ON "OemContribution"("type");
CREATE INDEX "OemAuditLog_entityType_entityId_idx" ON "OemAuditLog"("entityType","entityId");
CREATE INDEX "OemAuditLog_actorId_idx" ON "OemAuditLog"("actorId");
CREATE INDEX "OemAuditLog_createdAt_idx" ON "OemAuditLog"("createdAt");
CREATE INDEX "ShopInventoryItem_oemPartId_idx" ON "ShopInventoryItem"("oemPartId");
CREATE INDEX "ShopInventoryItem_partBrandId_idx" ON "ShopInventoryItem"("partBrandId");
CREATE INDEX "ShopInventoryItem_normalizedExternalPartNumber_idx" ON "ShopInventoryItem"("normalizedExternalPartNumber");

ALTER TABLE "OemPart" ADD CONSTRAINT "OemPart_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPart" ADD CONSTRAINT "OemPart_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OemSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartAlias" ADD CONSTRAINT "OemPartAlias_oemPartId_fkey" FOREIGN KEY ("oemPartId") REFERENCES "OemPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OemPartAlias" ADD CONSTRAINT "OemPartAlias_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OemSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartCategory" ADD CONSTRAINT "OemPartCategory_oemPartId_fkey" FOREIGN KEY ("oemPartId") REFERENCES "OemPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OemPartCategory" ADD CONSTRAINT "OemPartCategory_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartCategory" ADD CONSTRAINT "OemPartCategory_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OemSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartBrand" ADD CONSTRAINT "OemPartBrand_oemPartId_fkey" FOREIGN KEY ("oemPartId") REFERENCES "OemPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OemPartBrand" ADD CONSTRAINT "OemPartBrand_partBrandId_fkey" FOREIGN KEY ("partBrandId") REFERENCES "PartBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartBrand" ADD CONSTRAINT "OemPartBrand_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OemSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartFitment" ADD CONSTRAINT "OemPartFitment_oemPartId_fkey" FOREIGN KEY ("oemPartId") REFERENCES "OemPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OemPartFitment" ADD CONSTRAINT "OemPartFitment_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartFitment" ADD CONSTRAINT "OemPartFitment_vehicleModelId_fkey" FOREIGN KEY ("vehicleModelId") REFERENCES "VehicleModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartFitment" ADD CONSTRAINT "OemPartFitment_vehicleGenerationId_fkey" FOREIGN KEY ("vehicleGenerationId") REFERENCES "VehicleGeneration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartFitment" ADD CONSTRAINT "OemPartFitment_vehicleSpecificationId_fkey" FOREIGN KEY ("vehicleSpecificationId") REFERENCES "VehicleSpecification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemPartFitment" ADD CONSTRAINT "OemPartFitment_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OemSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemCrossReference" ADD CONSTRAINT "OemCrossReference_fromOemPartId_fkey" FOREIGN KEY ("fromOemPartId") REFERENCES "OemPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OemCrossReference" ADD CONSTRAINT "OemCrossReference_toOemPartId_fkey" FOREIGN KEY ("toOemPartId") REFERENCES "OemPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemCrossReference" ADD CONSTRAINT "OemCrossReference_partBrandId_fkey" FOREIGN KEY ("partBrandId") REFERENCES "PartBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemCrossReference" ADD CONSTRAINT "OemCrossReference_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OemSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemImportBatch" ADD CONSTRAINT "OemImportBatch_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "OemSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemImportBatch" ADD CONSTRAINT "OemImportBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OemContribution" ADD CONSTRAINT "OemContribution_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemContribution" ADD CONSTRAINT "OemContribution_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OemContribution" ADD CONSTRAINT "OemContribution_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OemAuditLog" ADD CONSTRAINT "OemAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_oemPartId_fkey" FOREIGN KEY ("oemPartId") REFERENCES "OemPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShopInventoryItem" ADD CONSTRAINT "ShopInventoryItem_partBrandId_fkey" FOREIGN KEY ("partBrandId") REFERENCES "PartBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
