CREATE TABLE "VinDecodeCache" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "wmi" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "generation" TEXT,
    "engineCode" TEXT,
    "year" INTEGER,
    "fuel" TEXT,
    "body" TEXT,
    "transmission" TEXT,
    "country" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "decodedAt" TIMESTAMP(3) NOT NULL,
    "rawData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VinDecodeCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VinDecodeCache_vin_key" ON "VinDecodeCache"("vin");
CREATE INDEX "VinDecodeCache_wmi_idx" ON "VinDecodeCache"("wmi");
CREATE INDEX "VinDecodeCache_manufacturer_idx" ON "VinDecodeCache"("manufacturer");
CREATE INDEX "VinDecodeCache_model_idx" ON "VinDecodeCache"("model");
CREATE INDEX "VinDecodeCache_engineCode_idx" ON "VinDecodeCache"("engineCode");
CREATE INDEX "VinDecodeCache_decodedAt_idx" ON "VinDecodeCache"("decodedAt");
