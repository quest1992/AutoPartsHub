-- Align historical explicit index names with the names generated from the
-- current Prisma schema. Renaming indexes does not rewrite table data.
ALTER INDEX IF EXISTS "PartCategoryCatalogItemMapping_sourceCategoryId_targetCatalogIt"
  RENAME TO "PartCategoryCatalogItemMapping_sourceCategoryId_targetCatal_key";

ALTER INDEX IF EXISTS "VehicleModification_identity_key"
  RENAME TO "VehicleModification_generationId_bodyTypeId_engineId_transm_key";
