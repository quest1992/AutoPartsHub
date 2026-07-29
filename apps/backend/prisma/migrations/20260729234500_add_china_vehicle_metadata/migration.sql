-- Additive metadata for the standalone China vehicle database seed.
-- No existing manufacturer, model, generation, or compatibility row is removed.
CREATE TYPE "VehicleManufacturerType" AS ENUM (
  'STATE_OWNED',
  'PRIVATE',
  'JOINT_VENTURE',
  'SUBBRAND',
  'EXPORT_BRAND',
  'COMMERCIAL',
  'HISTORIC',
  'OTHER'
);

CREATE TYPE "VehiclePowertrainType" AS ENUM (
  'ICE',
  'HEV',
  'PHEV',
  'BEV',
  'EREV',
  'FCEV',
  'UNKNOWN'
);

ALTER TABLE "Manufacturer"
  ADD COLUMN "chineseName" TEXT,
  ADD COLUMN "pinyin" TEXT,
  ADD COLUMN "parentCompany" TEXT,
  ADD COLUMN "manufacturerType" "VehicleManufacturerType",
  ADD COLUMN "sourceRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "VehicleModel"
  ADD COLUMN "chineseName" TEXT,
  ADD COLUMN "exportName" TEXT,
  ADD COLUMN "bodyStyle" TEXT,
  ADD COLUMN "segment" TEXT,
  ADD COLUMN "powertrainType" "VehiclePowertrainType",
  ADD COLUMN "platform" TEXT,
  ADD COLUMN "bodyCode" TEXT,
  ADD COLUMN "exportIndex" TEXT,
  ADD COLUMN "sourceRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "VehicleGeneration"
  ADD COLUMN "platform" TEXT,
  ADD COLUMN "bodyCode" TEXT,
  ADD COLUMN "exportIndex" TEXT,
  ADD COLUMN "sourceRefs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "Manufacturer_manufacturerType_idx"
  ON "Manufacturer"("manufacturerType");
CREATE INDEX "VehicleModel_powertrainType_idx"
  ON "VehicleModel"("powertrainType");
