-- Additive factory specifications. Existing vehicle/catalog data is preserved.
ALTER TYPE "VehiclePowertrainType" ADD VALUE IF NOT EXISTS 'MHEV' AFTER 'ICE';

ALTER TABLE "Manufacturer"
  ADD COLUMN "city" TEXT;

ALTER TABLE "VehicleModel"
  ADD COLUMN "series" TEXT,
  ADD COLUMN "vehicleClass" TEXT,
  ADD COLUMN "doors" INTEGER,
  ADD COLUMN "seats" INTEGER;

CREATE TABLE "VehicleSpecification" (
  "id" TEXT NOT NULL,
  "vehicleModelId" TEXT NOT NULL,
  "generationId" TEXT,
  "sourceKey" TEXT NOT NULL,
  "specHash" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "trim" TEXT,
  "variant" TEXT,
  "powertrainType" "VehiclePowertrainType" NOT NULL,
  "driveType" TEXT,
  "transmissionType" TEXT,
  "engineCode" TEXT,
  "engineDisplacementCc" INTEGER,
  "engineTurbo" BOOLEAN,
  "engineCylinders" INTEGER,
  "enginePowerKw" DECIMAL(10,3),
  "engineTorqueNm" DECIMAL(10,3),
  "motorCount" INTEGER,
  "motorPowerKw" DECIMAL(10,3),
  "motorTorqueNm" DECIMAL(10,3),
  "motorPositions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "batteryManufacturer" TEXT,
  "batteryChemistry" TEXT,
  "batteryGrossKwh" DECIMAL(10,3),
  "batteryUsableKwh" DECIMAL(10,3),
  "rangeCltcKm" DECIMAL(10,3),
  "rangeWltpKm" DECIMAL(10,3),
  "rangeEpaKm" DECIMAL(10,3),
  "rangeNedcKm" DECIMAL(10,3),
  "rangeData" JSONB NOT NULL,
  "acChargeKw" DECIMAL(10,3),
  "dcChargeKw" DECIMAL(10,3),
  "chargeConnectors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "platform" TEXT,
  "bodyCode" TEXT,
  "internalIndex" TEXT,
  "doors" INTEGER,
  "seats" INTEGER,
  "sourceTitle" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceRetrievedAt" TIMESTAMP(3) NOT NULL,
  "sourceLicense" TEXT NOT NULL,
  "sources" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleSpecification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleSpecification_sourceKey_key"
  ON "VehicleSpecification"("sourceKey");
CREATE UNIQUE INDEX "VehicleSpecification_specHash_key"
  ON "VehicleSpecification"("specHash");
CREATE INDEX "VehicleSpecification_vehicleModelId_idx"
  ON "VehicleSpecification"("vehicleModelId");
CREATE INDEX "VehicleSpecification_generationId_idx"
  ON "VehicleSpecification"("generationId");
CREATE INDEX "VehicleSpecification_year_idx"
  ON "VehicleSpecification"("year");
CREATE INDEX "VehicleSpecification_powertrainType_idx"
  ON "VehicleSpecification"("powertrainType");
CREATE INDEX "VehicleSpecification_batteryManufacturer_idx"
  ON "VehicleSpecification"("batteryManufacturer");
CREATE INDEX "VehicleSpecification_platform_idx"
  ON "VehicleSpecification"("platform");
CREATE INDEX "VehicleSpecification_isActive_idx"
  ON "VehicleSpecification"("isActive");

ALTER TABLE "VehicleSpecification"
  ADD CONSTRAINT "VehicleSpecification_vehicleModelId_fkey"
  FOREIGN KEY ("vehicleModelId") REFERENCES "VehicleModel"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleSpecification"
  ADD CONSTRAINT "VehicleSpecification_generationId_fkey"
  FOREIGN KEY ("generationId") REFERENCES "VehicleGeneration"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
