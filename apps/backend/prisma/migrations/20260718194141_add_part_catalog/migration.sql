-- CreateEnum
CREATE TYPE "PartSide" AS ENUM ('NONE', 'LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "PartPosition" AS ENUM ('NONE', 'FRONT', 'REAR');

-- CreateTable
CREATE TABLE "AppSequence" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSequence_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PartCatalogItem" (
    "id" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "side" "PartSide" NOT NULL DEFAULT 'NONE',
    "position" "PartPosition" NOT NULL DEFAULT 'NONE',
    "isUniversal" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartCompatibility" (
    "id" TEXT NOT NULL,
    "partCatalogItemId" TEXT NOT NULL,
    "vehicleGenerationId" TEXT NOT NULL,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartCatalogItem_internalCode_key" ON "PartCatalogItem"("internalCode");

-- CreateIndex
CREATE INDEX "PartCatalogItem_categoryId_idx" ON "PartCatalogItem"("categoryId");

-- CreateIndex
CREATE INDEX "PartCatalogItem_isActive_idx" ON "PartCatalogItem"("isActive");

-- CreateIndex
CREATE INDEX "PartCatalogItem_isUniversal_idx" ON "PartCatalogItem"("isUniversal");

-- CreateIndex
CREATE INDEX "PartCatalogItem_side_idx" ON "PartCatalogItem"("side");

-- CreateIndex
CREATE INDEX "PartCatalogItem_position_idx" ON "PartCatalogItem"("position");

-- CreateIndex
CREATE UNIQUE INDEX "PartCatalogItem_categoryId_slug_side_position_key" ON "PartCatalogItem"("categoryId", "slug", "side", "position");

-- CreateIndex
CREATE INDEX "PartCompatibility_partCatalogItemId_idx" ON "PartCompatibility"("partCatalogItemId");

-- CreateIndex
CREATE INDEX "PartCompatibility_vehicleGenerationId_idx" ON "PartCompatibility"("vehicleGenerationId");

-- CreateIndex
CREATE UNIQUE INDEX "PartCompatibility_partCatalogItemId_vehicleGenerationId_key" ON "PartCompatibility"("partCatalogItemId", "vehicleGenerationId");

-- AddForeignKey
ALTER TABLE "PartCatalogItem" ADD CONSTRAINT "PartCatalogItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCompatibility" ADD CONSTRAINT "PartCompatibility_partCatalogItemId_fkey" FOREIGN KEY ("partCatalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartCompatibility" ADD CONSTRAINT "PartCompatibility_vehicleGenerationId_fkey" FOREIGN KEY ("vehicleGenerationId") REFERENCES "VehicleGeneration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
