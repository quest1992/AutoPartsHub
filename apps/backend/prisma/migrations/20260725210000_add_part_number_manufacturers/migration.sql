CREATE TABLE "PartNumberManufacturer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartNumberManufacturer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartNumberManufacturer_name_key"
ON "PartNumberManufacturer"("name");

CREATE UNIQUE INDEX "PartNumberManufacturer_normalizedName_key"
ON "PartNumberManufacturer"("normalizedName");

CREATE INDEX "PartNumberManufacturer_isActive_idx"
ON "PartNumberManufacturer"("isActive");

ALTER TABLE "PartNumber" ADD COLUMN "manufacturerId" TEXT;

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
WHERE "brand" IS NOT NULL AND TRIM("brand") <> ''
GROUP BY UPPER(REGEXP_REPLACE(TRIM("brand"), '[^[:alnum:]]', '', 'g'))
ON CONFLICT ("normalizedName") DO NOTHING;

UPDATE "PartNumber" pn
SET "manufacturerId" = pnm."id"
FROM "PartNumberManufacturer" pnm
WHERE pn."brand" IS NOT NULL
  AND pnm."normalizedName" =
      UPPER(REGEXP_REPLACE(TRIM(pn."brand"), '[^[:alnum:]]', '', 'g'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "PartNumber"
    WHERE "manufacturerId" IS NOT NULL
    GROUP BY "manufacturerId", "normalizedNumber"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add manufacturer/number uniqueness: duplicate PartNumber rows exist';
  END IF;
END $$;

CREATE UNIQUE INDEX "PartNumber_manufacturerId_normalizedNumber_key"
ON "PartNumber"("manufacturerId", "normalizedNumber");

CREATE INDEX "PartNumber_manufacturerId_idx"
ON "PartNumber"("manufacturerId");

ALTER TABLE "PartNumber"
ADD CONSTRAINT "PartNumber_manufacturerId_fkey"
FOREIGN KEY ("manufacturerId")
REFERENCES "PartNumberManufacturer"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "PartNumberManufacturer"
    ("id", "name", "normalizedName", "isActive", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'Toyota', 'TOYOTA', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Honda', 'HONDA', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Bosch', 'BOSCH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Denso', 'DENSO', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'NGK', 'NGK', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'MANN', 'MANN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Mahle', 'MAHLE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Sakura', 'SAKURA', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("normalizedName") DO NOTHING;
