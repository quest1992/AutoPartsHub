/*
  Warnings:

  - Made the column `normalizedName` on table `PartCatalogItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `searchTokens` on table `PartCatalogItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PartCatalogItem" ALTER COLUMN "normalizedName" SET NOT NULL,
ALTER COLUMN "searchTokens" SET NOT NULL;
