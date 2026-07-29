CREATE TYPE "PartTaxonomyDecisionStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'APPLYING', 'APPLIED', 'FAILED', 'CANCELLED');
CREATE TYPE "PartTaxonomyRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "PartTaxonomyDuplicateStrategy" AS ENUM ('CREATE_NEW', 'USE_EXISTING', 'MERGE_WITH_EXISTING', 'KEEP_SEPARATE', 'REQUIRE_REVIEW');

CREATE TABLE "PartTaxonomyDecision" (
  "id" TEXT NOT NULL,
  "sourceCategoryId" TEXT NOT NULL,
  "classification" "PartCategoryClassification" NOT NULL,
  "targetCategoryId" TEXT,
  "targetCatalogItemId" TEXT,
  "canonicalName" TEXT,
  "canonicalSlug" TEXT,
  "side" "PartSide" NOT NULL DEFAULT 'NONE',
  "position" "PartPosition" NOT NULL DEFAULT 'NONE',
  "unit" TEXT,
  "aliases" JSONB,
  "duplicateStrategy" "PartTaxonomyDuplicateStrategy",
  "deactivateSource" BOOLEAN NOT NULL DEFAULT true,
  "status" "PartTaxonomyDecisionStatus" NOT NULL DEFAULT 'DRAFT',
  "riskLevel" "PartTaxonomyRiskLevel" NOT NULL DEFAULT 'MEDIUM',
  "notes" TEXT,
  "reviewReason" TEXT,
  "errorMessage" TEXT,
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "appliedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3),
  CONSTRAINT "PartTaxonomyDecision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartTaxonomyAuditEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "oldValues" JSONB,
  "newValues" JSONB,
  "batchId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartTaxonomyAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartTaxonomyDecision_sourceCategoryId_idx" ON "PartTaxonomyDecision"("sourceCategoryId");
CREATE INDEX "PartTaxonomyDecision_targetCategoryId_idx" ON "PartTaxonomyDecision"("targetCategoryId");
CREATE INDEX "PartTaxonomyDecision_targetCatalogItemId_idx" ON "PartTaxonomyDecision"("targetCatalogItemId");
CREATE INDEX "PartTaxonomyDecision_status_idx" ON "PartTaxonomyDecision"("status");
CREATE INDEX "PartTaxonomyDecision_classification_idx" ON "PartTaxonomyDecision"("classification");
CREATE INDEX "PartTaxonomyDecision_riskLevel_idx" ON "PartTaxonomyDecision"("riskLevel");
CREATE INDEX "PartTaxonomyDecision_createdById_idx" ON "PartTaxonomyDecision"("createdById");
CREATE INDEX "PartTaxonomyAuditEvent_entityType_entityId_idx" ON "PartTaxonomyAuditEvent"("entityType", "entityId");
CREATE INDEX "PartTaxonomyAuditEvent_userId_idx" ON "PartTaxonomyAuditEvent"("userId");
CREATE INDEX "PartTaxonomyAuditEvent_batchId_idx" ON "PartTaxonomyAuditEvent"("batchId");
CREATE INDEX "PartTaxonomyAuditEvent_createdAt_idx" ON "PartTaxonomyAuditEvent"("createdAt");

ALTER TABLE "PartTaxonomyDecision" ADD CONSTRAINT "PartTaxonomyDecision_sourceCategoryId_fkey" FOREIGN KEY ("sourceCategoryId") REFERENCES "PartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartTaxonomyDecision" ADD CONSTRAINT "PartTaxonomyDecision_targetCategoryId_fkey" FOREIGN KEY ("targetCategoryId") REFERENCES "PartCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartTaxonomyDecision" ADD CONSTRAINT "PartTaxonomyDecision_targetCatalogItemId_fkey" FOREIGN KEY ("targetCatalogItemId") REFERENCES "PartCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartTaxonomyDecision" ADD CONSTRAINT "PartTaxonomyDecision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartTaxonomyDecision" ADD CONSTRAINT "PartTaxonomyDecision_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartTaxonomyDecision" ADD CONSTRAINT "PartTaxonomyDecision_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PartTaxonomyAuditEvent" ADD CONSTRAINT "PartTaxonomyAuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
