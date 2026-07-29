-- Additive vehicle database foundation. Existing vehicle and fitment rows are preserved.
ALTER TABLE "Manufacturer"
  ADD COLUMN "website" TEXT,
  ADD COLUMN "logo" TEXT;

ALTER TABLE "VehicleModel"
  ADD COLUMN "internalCode" TEXT;

ALTER TABLE "VehicleGeneration"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "notes" TEXT;

CREATE TABLE "BodyType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BodyType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FuelType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FuelType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DriveType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DriveType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransmissionType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransmissionType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SteeringPosition" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SteeringPosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketRegion" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketRegion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BodyType_name_key" ON "BodyType"("name");
CREATE UNIQUE INDEX "BodyType_slug_key" ON "BodyType"("slug");
CREATE UNIQUE INDEX "FuelType_name_key" ON "FuelType"("name");
CREATE UNIQUE INDEX "FuelType_slug_key" ON "FuelType"("slug");
CREATE UNIQUE INDEX "DriveType_name_key" ON "DriveType"("name");
CREATE UNIQUE INDEX "DriveType_slug_key" ON "DriveType"("slug");
CREATE UNIQUE INDEX "TransmissionType_name_key" ON "TransmissionType"("name");
CREATE UNIQUE INDEX "TransmissionType_slug_key" ON "TransmissionType"("slug");
CREATE UNIQUE INDEX "SteeringPosition_name_key" ON "SteeringPosition"("name");
CREATE UNIQUE INDEX "SteeringPosition_slug_key" ON "SteeringPosition"("slug");
CREATE UNIQUE INDEX "MarketRegion_name_key" ON "MarketRegion"("name");
CREATE UNIQUE INDEX "MarketRegion_slug_key" ON "MarketRegion"("slug");

INSERT INTO "FuelType" ("id", "name", "slug", "updatedAt")
SELECT gen_random_uuid()::text, fuel,
  CASE
    WHEN regexp_replace(lower(fuel), '[^a-z0-9]+', '-', 'g') = ''
      THEN 'fuel-' || substr(md5(fuel), 1, 12)
    ELSE trim(BOTH '-' FROM regexp_replace(lower(fuel), '[^a-z0-9]+', '-', 'g'))
  END,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT COALESCE(NULLIF(trim(fuel), ''), 'UNKNOWN') AS fuel
  FROM "Engine"
) source;

INSERT INTO "BodyType" ("id", "name", "slug", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Sedan', 'sedan', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'SUV', 'suv', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Coupe', 'coupe', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Pickup', 'pickup', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Liftback', 'liftback', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Minivan', 'minivan', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Van', 'van', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Universal', 'universal', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Hatchback', 'hatchback', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Roadster', 'roadster', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Cabriolet', 'cabriolet', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Fastback', 'fastback', CURRENT_TIMESTAMP);

INSERT INTO "FuelType" ("id", "name", "slug", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Petrol', 'petrol', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Diesel', 'diesel', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Hybrid', 'hybrid', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Plug-in Hybrid', 'plug-in-hybrid', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Electric', 'electric', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Hydrogen', 'hydrogen', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Gas', 'gas', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "DriveType" ("id", "name", "slug", "updatedAt") VALUES
  (gen_random_uuid()::text, 'FWD', 'fwd', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'RWD', 'rwd', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'AWD', 'awd', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, '4WD', '4wd', CURRENT_TIMESTAMP);

INSERT INTO "TransmissionType" ("id", "name", "slug", "updatedAt") VALUES
  (gen_random_uuid()::text, 'MT', 'mt', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'AT', 'at', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CVT', 'cvt', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'DCT', 'dct', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Robot', 'robot', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'eCVT', 'ecvt', CURRENT_TIMESTAMP);

INSERT INTO "SteeringPosition" ("id", "name", "slug", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Left Hand Drive', 'left-hand-drive', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Right Hand Drive', 'right-hand-drive', CURRENT_TIMESTAMP);

INSERT INTO "MarketRegion" ("id", "name", "slug", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Europe', 'europe', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Japan', 'japan', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'USA', 'usa', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'China', 'china', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Middle East', 'middle-east', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Russia', 'russia', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'CIS', 'cis', CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Global', 'global', CURRENT_TIMESTAMP);

ALTER TABLE "Engine"
  ADD COLUMN "manufacturerId" TEXT,
  ADD COLUMN "fuelTypeId" TEXT,
  ADD COLUMN "displacementCC" INTEGER,
  ADD COLUMN "cylinders" INTEGER,
  ADD COLUMN "horsepower" INTEGER,
  ADD COLUMN "torque" INTEGER,
  ADD COLUMN "turbo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "aspiration" TEXT,
  ADD COLUMN "valveCount" INTEGER,
  ADD COLUMN "emissionStandard" TEXT,
  ADD COLUMN "notes" TEXT;

UPDATE "Engine" engine
SET "manufacturerId" = model."manufacturerId",
    "fuelTypeId" = fuel_type."id",
    "displacementCC" = CASE WHEN engine."volume" IS NULL THEN NULL ELSE round(engine."volume" * 1000)::integer END,
    "horsepower" = engine."power"
FROM "VehicleGeneration" generation
JOIN "VehicleModel" model ON model."id" = generation."vehicleModelId"
CROSS JOIN "FuelType" fuel_type
WHERE generation."id" = engine."generationId"
  AND lower(fuel_type."name") = lower(COALESCE(NULLIF(trim(engine."fuel"), ''), 'UNKNOWN'));

ALTER TABLE "Engine"
  ALTER COLUMN "generationId" DROP NOT NULL,
  ALTER COLUMN "manufacturerId" SET NOT NULL,
  ALTER COLUMN "fuelTypeId" SET NOT NULL;

DROP INDEX "Engine_generationId_code_key";

CREATE TABLE "VehicleModification" (
  "id" TEXT NOT NULL,
  "generationId" TEXT NOT NULL,
  "bodyTypeId" TEXT NOT NULL,
  "engineId" TEXT NOT NULL,
  "transmissionTypeId" TEXT NOT NULL,
  "driveTypeId" TEXT NOT NULL,
  "fuelTypeId" TEXT NOT NULL,
  "steeringPositionId" TEXT NOT NULL,
  "marketRegionId" TEXT NOT NULL,
  "productionFrom" INTEGER,
  "productionTo" INTEGER,
  "doors" INTEGER,
  "powerKW" INTEGER,
  "powerHP" INTEGER,
  "vinFrom" TEXT,
  "vinTo" TEXT,
  "remarks" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VehicleModification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleDataChange" (
  "id" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "changedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleDataChange_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleDataChangeField" (
  "id" TEXT NOT NULL,
  "changeId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  CONSTRAINT "VehicleDataChangeField_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Engine_manufacturerId_code_key" ON "Engine"("manufacturerId", "code");
CREATE UNIQUE INDEX "VehicleModification_identity_key" ON "VehicleModification"("generationId", "bodyTypeId", "engineId", "transmissionTypeId", "driveTypeId", "steeringPositionId", "marketRegionId", "productionFrom", "productionTo");

CREATE INDEX "BodyType_isActive_idx" ON "BodyType"("isActive");
CREATE INDEX "FuelType_isActive_idx" ON "FuelType"("isActive");
CREATE INDEX "DriveType_isActive_idx" ON "DriveType"("isActive");
CREATE INDEX "TransmissionType_isActive_idx" ON "TransmissionType"("isActive");
CREATE INDEX "SteeringPosition_isActive_idx" ON "SteeringPosition"("isActive");
CREATE INDEX "MarketRegion_isActive_idx" ON "MarketRegion"("isActive");
CREATE INDEX "Engine_manufacturerId_idx" ON "Engine"("manufacturerId");
CREATE INDEX "Engine_fuelTypeId_idx" ON "Engine"("fuelTypeId");
CREATE INDEX "Engine_displacementCC_idx" ON "Engine"("displacementCC");
CREATE INDEX "Engine_horsepower_idx" ON "Engine"("horsepower");
CREATE INDEX "VehicleModification_generationId_idx" ON "VehicleModification"("generationId");
CREATE INDEX "VehicleModification_engineId_idx" ON "VehicleModification"("engineId");
CREATE INDEX "VehicleModification_bodyTypeId_idx" ON "VehicleModification"("bodyTypeId");
CREATE INDEX "VehicleModification_transmissionTypeId_idx" ON "VehicleModification"("transmissionTypeId");
CREATE INDEX "VehicleModification_driveTypeId_idx" ON "VehicleModification"("driveTypeId");
CREATE INDEX "VehicleModification_fuelTypeId_idx" ON "VehicleModification"("fuelTypeId");
CREATE INDEX "VehicleModification_steeringPositionId_idx" ON "VehicleModification"("steeringPositionId");
CREATE INDEX "VehicleModification_marketRegionId_idx" ON "VehicleModification"("marketRegionId");
CREATE INDEX "VehicleModification_productionFrom_productionTo_idx" ON "VehicleModification"("productionFrom", "productionTo");
CREATE INDEX "VehicleModification_isActive_idx" ON "VehicleModification"("isActive");
CREATE INDEX "VehicleDataChange_entityType_entityId_idx" ON "VehicleDataChange"("entityType", "entityId");
CREATE INDEX "VehicleDataChange_changedById_idx" ON "VehicleDataChange"("changedById");
CREATE INDEX "VehicleDataChange_createdAt_idx" ON "VehicleDataChange"("createdAt");
CREATE INDEX "VehicleDataChangeField_changeId_idx" ON "VehicleDataChangeField"("changeId");

ALTER TABLE "Engine" ADD CONSTRAINT "Engine_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Engine" ADD CONSTRAINT "Engine_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "VehicleGeneration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_bodyTypeId_fkey" FOREIGN KEY ("bodyTypeId") REFERENCES "BodyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_engineId_fkey" FOREIGN KEY ("engineId") REFERENCES "Engine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_transmissionTypeId_fkey" FOREIGN KEY ("transmissionTypeId") REFERENCES "TransmissionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_driveTypeId_fkey" FOREIGN KEY ("driveTypeId") REFERENCES "DriveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "FuelType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_steeringPositionId_fkey" FOREIGN KEY ("steeringPositionId") REFERENCES "SteeringPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_marketRegionId_fkey" FOREIGN KEY ("marketRegionId") REFERENCES "MarketRegion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleDataChange" ADD CONSTRAINT "VehicleDataChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleDataChangeField" ADD CONSTRAINT "VehicleDataChangeField_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "VehicleDataChange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
