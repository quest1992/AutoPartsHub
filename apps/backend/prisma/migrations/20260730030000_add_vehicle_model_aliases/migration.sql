CREATE TABLE "VehicleModelAlias" (
    "id" TEXT NOT NULL,
    "vehicleModelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceLicense" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleModelAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleModelAlias_vehicleModelId_normalizedName_key"
ON "VehicleModelAlias"("vehicleModelId", "normalizedName");

CREATE INDEX "VehicleModelAlias_normalizedName_idx"
ON "VehicleModelAlias"("normalizedName");

CREATE INDEX "VehicleModelAlias_vehicleModelId_idx"
ON "VehicleModelAlias"("vehicleModelId");

ALTER TABLE "VehicleModelAlias"
ADD CONSTRAINT "VehicleModelAlias_vehicleModelId_fkey"
FOREIGN KEY ("vehicleModelId") REFERENCES "VehicleModel"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
