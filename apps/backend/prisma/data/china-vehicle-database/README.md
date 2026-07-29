# China vehicle database sources

This directory contains pinned, offline source snapshots for
`prisma/china-vehicle-database.seed.ts`. The seed is additive, is not connected
to Prisma's automatic seed command, and runs in dry-run mode unless `--apply`
is passed.

## Wikidata

- Snapshot date: 2026-07-29
- License: CC0 1.0
- Files:
  - `wikidata-models-2026-07-29.json`
  - `wikidata-manufacturers-2026-07-29.json`
  - `wikidata-brands-2026-07-29.json`
- Query scope: entities classified as car models, linked with `manufacturer`
  to an organization whose country is China.
- Source: https://query.wikidata.org/
- License information: https://www.wikidata.org/wiki/Wikidata:Licensing

Wikidata provides manufacturer/model identity, Chinese and English labels,
selected inception/end dates, parent organizations, and official websites.
Missing values stay null.

## OpenEV Data

- Snapshot date: 2026-07-29
- Upstream commit: `8edb266da3b2c4424dd031e248468ba5d445da5d`
- License: CDLA-Permissive-2.0
- File: `open-ev-data-china.json`
- Upstream: https://github.com/open-ev-data/open-ev-data-dataset
- Included fields: make, model, vehicle/body type, and years for the Chinese
  brands present in the upstream repository.

Every OpenEV entry is treated as `BEV`. Its year directories are imported as
`VehicleGeneration.kind = MODEL_YEAR`. Variants, batteries, engines,
transmissions, and charging specifications are intentionally excluded.

### Factory specification snapshot

- File: `open-ev-china-specifications-v1.24.0.json`
- Release: OpenEV Data `v1.24.0`
- Records: 382 factory configurations for 95 models and 21 Chinese brands
- License: CDLA-Permissive-2.0
- Release URL:
  https://github.com/open-ev-data/open-ev-data-dataset/releases/tag/v1.24.0

The standalone `prisma/china-vehicle-specifications.seed.ts` imports only
fields present in this compiled release. Every accepted specification must
contain at least one valid HTTP(S) source URL and retrieval date. CLTC, WLTP,
EPA, and NEDC ranges are kept as separate values and are never converted.

## Curated identity crosswalk

`prisma/china-vehicle-curated.ts` resolves corporate suffixes, export names,
subbrands, and aliases such as `BYD Auto`, `BYD Automobile`, and `BYD` to one
canonical manufacturer. It also contains links to official brand websites
where available.

The crosswalk does not create model generations or model years. No data from
commercial catalogues, websites without a reusable-data license, or
academic-only datasets is included.
