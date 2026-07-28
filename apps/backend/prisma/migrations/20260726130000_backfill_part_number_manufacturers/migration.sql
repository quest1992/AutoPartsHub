INSERT INTO "PartNumberManufacturer"
    ("id", "name", "normalizedName", "isActive", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    MIN(TRIM("brand")),
    UPPER(REGEXP_REPLACE(TRIM("brand"), '[^[:alnum:]]', '', 'g')),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "PartNumber"
WHERE "manufacturerId" IS NULL
  AND "brand" IS NOT NULL
  AND TRIM("brand") <> ''
GROUP BY UPPER(REGEXP_REPLACE(TRIM("brand"), '[^[:alnum:]]', '', 'g'))
ON CONFLICT ("normalizedName") DO NOTHING;

UPDATE "PartNumber" pn
SET "manufacturerId" = pnm."id"
FROM "PartNumberManufacturer" pnm
WHERE pn."manufacturerId" IS NULL
  AND pn."brand" IS NOT NULL
  AND TRIM(pn."brand") <> ''
  AND pnm."normalizedName" =
      UPPER(REGEXP_REPLACE(TRIM(pn."brand"), '[^[:alnum:]]', '', 'g'));

INSERT INTO "PartNumberManufacturer"
    ("id", "name", "normalizedName", "isActive", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'Unknown', 'UNKNOWN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("normalizedName") DO UPDATE
SET "isActive" = true;

UPDATE "PartNumber"
SET "manufacturerId" = (
    SELECT "id"
    FROM "PartNumberManufacturer"
    WHERE "normalizedName" = 'UNKNOWN'
)
WHERE "manufacturerId" IS NULL;

ALTER TABLE "PartNumber"
ALTER COLUMN "manufacturerId" SET NOT NULL;
