ALTER TABLE "OemPart" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OemPartFitment" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OemCrossReference" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "OemPart_isActive_idx" ON "OemPart"("isActive");
CREATE INDEX "OemPartFitment_isActive_idx" ON "OemPartFitment"("isActive");
CREATE INDEX "OemCrossReference_isActive_idx" ON "OemCrossReference"("isActive");