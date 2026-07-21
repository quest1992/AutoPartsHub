-- CreateTable
CREATE TABLE "VehicleGeneration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "vehicleModelId" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleGeneration_vehicleModelId_idx" ON "VehicleGeneration"("vehicleModelId");

-- CreateIndex
CREATE INDEX "VehicleGeneration_isActive_idx" ON "VehicleGeneration"("isActive");

-- CreateIndex
CREATE INDEX "VehicleGeneration_startYear_idx" ON "VehicleGeneration"("startYear");

-- CreateIndex
CREATE INDEX "VehicleGeneration_endYear_idx" ON "VehicleGeneration"("endYear");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleGeneration_vehicleModelId_slug_key" ON "VehicleGeneration"("vehicleModelId", "slug");

-- AddForeignKey
ALTER TABLE "VehicleGeneration" ADD CONSTRAINT "VehicleGeneration_vehicleModelId_fkey" FOREIGN KEY ("vehicleModelId") REFERENCES "VehicleModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
