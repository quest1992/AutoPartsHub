ALTER TABLE "VehicleModel"
ADD COLUMN "mergedIntoId" TEXT;

CREATE INDEX "VehicleModel_mergedIntoId_idx"
ON "VehicleModel"("mergedIntoId");

ALTER TABLE "VehicleModel"
ADD CONSTRAINT "VehicleModel_mergedIntoId_fkey"
FOREIGN KEY ("mergedIntoId") REFERENCES "VehicleModel"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "VehicleDataAuditLog" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "sourceModelId" TEXT NOT NULL,
    "targetModelId" TEXT,
    "beforeJson" JSONB NOT NULL,
    "afterJson" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleDataAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VehicleDataAuditLog_batchId_idx"
ON "VehicleDataAuditLog"("batchId");

CREATE INDEX "VehicleDataAuditLog_sourceModelId_idx"
ON "VehicleDataAuditLog"("sourceModelId");

CREATE INDEX "VehicleDataAuditLog_targetModelId_idx"
ON "VehicleDataAuditLog"("targetModelId");

CREATE INDEX "VehicleDataAuditLog_createdAt_idx"
ON "VehicleDataAuditLog"("createdAt");
