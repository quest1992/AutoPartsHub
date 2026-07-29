-- Enable trigram operator classes used by contains/ILIKE searches.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "PartCatalogItem_normalizedName_trgm_idx" ON "PartCatalogItem" USING GIN ("normalizedName" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "PartCatalogItem_searchTokens_trgm_idx" ON "PartCatalogItem" USING GIN ("searchTokens" gin_trgm_ops);
