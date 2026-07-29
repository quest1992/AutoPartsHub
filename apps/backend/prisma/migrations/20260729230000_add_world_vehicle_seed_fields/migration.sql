-- Additive metadata required by the standalone world vehicle database seed.
-- Existing manufacturers, models, generations, and compatibility links are preserved.
CREATE TYPE "VehicleGenerationKind" AS ENUM ('GENERATION', 'MODEL_YEAR');

ALTER TABLE "Manufacturer"
  ADD COLUMN "englishName" TEXT,
  ADD COLUMN "foundedYear" INTEGER;

ALTER TABLE "VehicleModel"
  ADD COLUMN "startYear" INTEGER,
  ADD COLUMN "endYear" INTEGER,
  ADD COLUMN "vehicleType" TEXT;

ALTER TABLE "VehicleGeneration"
  ADD COLUMN "isFacelift" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "kind" "VehicleGenerationKind" NOT NULL DEFAULT 'GENERATION';

CREATE INDEX "VehicleModel_startYear_idx" ON "VehicleModel"("startYear");
CREATE INDEX "VehicleModel_endYear_idx" ON "VehicleModel"("endYear");
CREATE INDEX "VehicleModel_vehicleType_idx" ON "VehicleModel"("vehicleType");
CREATE INDEX "VehicleGeneration_kind_idx" ON "VehicleGeneration"("kind");
