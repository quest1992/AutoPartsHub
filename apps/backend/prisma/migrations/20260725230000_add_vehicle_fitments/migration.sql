CREATE TABLE "Engine" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "volume" DECIMAL(4,2),
    "fuel" TEXT NOT NULL,
    "power" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Engine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleFitment" (
    "id" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "engineId" TEXT NOT NULL,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VehicleFitment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Engine_generationId_code_key" ON "Engine"("generationId", "code");
CREATE INDEX "Engine_generationId_idx" ON "Engine"("generationId");
CREATE INDEX "Engine_code_idx" ON "Engine"("code");
CREATE INDEX "Engine_fuel_idx" ON "Engine"("fuel");
CREATE INDEX "Engine_isActive_idx" ON "Engine"("isActive");

CREATE UNIQUE INDEX "VehicleFitment_catalogItemId_engineId_yearFrom_yearTo_key"
ON "VehicleFitment"("catalogItemId", "engineId", "yearFrom", "yearTo");
CREATE INDEX "VehicleFitment_catalogItemId_idx" ON "VehicleFitment"("catalogItemId");
CREATE INDEX "VehicleFitment_engineId_idx" ON "VehicleFitment"("engineId");
CREATE INDEX "VehicleFitment_yearFrom_idx" ON "VehicleFitment"("yearFrom");
CREATE INDEX "VehicleFitment_yearTo_idx" ON "VehicleFitment"("yearTo");

ALTER TABLE "Engine"
ADD CONSTRAINT "Engine_generationId_fkey"
FOREIGN KEY ("generationId") REFERENCES "VehicleGeneration"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleFitment"
ADD CONSTRAINT "VehicleFitment_catalogItemId_fkey"
FOREIGN KEY ("catalogItemId") REFERENCES "PartCatalogItem"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleFitment"
ADD CONSTRAINT "VehicleFitment_engineId_fkey"
FOREIGN KEY ("engineId") REFERENCES "Engine"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Manufacturer"
  ("id", "name", "slug", "country", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Toyota', 'toyota', 'Japan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Honda', 'honda', 'Japan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Hyundai', 'hyundai', 'South Korea', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Kia', 'kia', 'South Korea', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BMW', 'bmw', 'Germany', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Mercedes', 'mercedes', 'Germany', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Audi', 'audi', 'Germany', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Volkswagen', 'volkswagen', 'Germany', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Nissan', 'nissan', 'Japan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Lexus', 'lexus', 'Japan', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE
SET "country" = COALESCE("Manufacturer"."country", EXCLUDED."country");
