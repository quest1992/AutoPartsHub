-- Additive world parts brand registry. Existing catalog and vehicle data are untouched.
CREATE TYPE "PartBrandType" AS ENUM (
  'OEM',
  'OES',
  'AFTERMARKET',
  'PREMIUM',
  'BUDGET',
  'PERFORMANCE',
  'EV',
  'MOTORCYCLE',
  'TRUCK',
  'BUS',
  'INDUSTRIAL'
);

CREATE TYPE "PartBrandStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'HISTORIC',
  'UNKNOWN'
);

CREATE TYPE "PartBrandAliasType" AS ENUM (
  'ALTERNATIVE_NAME',
  'ABBREVIATION',
  'TRADE_NAME',
  'PREVIOUS_NAME'
);

CREATE TABLE "PartBrand" (
  "id" TEXT NOT NULL,
  "officialName" TEXT NOT NULL,
  "englishName" TEXT,
  "normalizedName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "countryOfOrigin" TEXT,
  "city" TEXT,
  "foundedYear" INTEGER,
  "parentCompany" TEXT,
  "officialWebsite" TEXT,
  "normalizedWebsite" TEXT,
  "status" "PartBrandStatus" NOT NULL DEFAULT 'UNKNOWN',
  "types" "PartBrandType"[] NOT NULL,
  "specializations" TEXT[] NOT NULL,
  "manufacturingCountries" TEXT[] NOT NULL,
  "logoUrl" TEXT,
  "sourceExternalId" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceLicense" TEXT NOT NULL,
  "sourceRetrievedAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartBrand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartBrandAlias" (
  "id" TEXT NOT NULL,
  "partBrandId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "type" "PartBrandAliasType" NOT NULL DEFAULT 'ALTERNATIVE_NAME',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartBrandAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartBrand_normalizedName_key" ON "PartBrand"("normalizedName");
CREATE UNIQUE INDEX "PartBrand_slug_key" ON "PartBrand"("slug");
CREATE UNIQUE INDEX "PartBrand_sourceName_sourceExternalId_key"
  ON "PartBrand"("sourceName", "sourceExternalId");
CREATE INDEX "PartBrand_countryOfOrigin_idx" ON "PartBrand"("countryOfOrigin");
CREATE INDEX "PartBrand_normalizedWebsite_idx" ON "PartBrand"("normalizedWebsite");
CREATE INDEX "PartBrand_status_idx" ON "PartBrand"("status");
CREATE INDEX "PartBrand_isActive_idx" ON "PartBrand"("isActive");

CREATE UNIQUE INDEX "PartBrandAlias_partBrandId_normalizedName_key"
  ON "PartBrandAlias"("partBrandId", "normalizedName");
CREATE INDEX "PartBrandAlias_normalizedName_idx" ON "PartBrandAlias"("normalizedName");
CREATE INDEX "PartBrandAlias_partBrandId_idx" ON "PartBrandAlias"("partBrandId");

ALTER TABLE "PartBrandAlias"
  ADD CONSTRAINT "PartBrandAlias_partBrandId_fkey"
  FOREIGN KEY ("partBrandId") REFERENCES "PartBrand"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
