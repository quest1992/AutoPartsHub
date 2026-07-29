# World vehicle seed sources

The standalone `prisma/vehicle-database.seed.ts` seed uses two pinned open
datasets. It never downloads data while writing to the database.

## VehiclesDB 2026.07.6

- File: `vehiclesdb-2026.07.6.csv`
- Upstream: https://github.com/vehiclesdb/vehiclesdb
- License: CC BY 4.0 (the upstream license is preserved in
  `VEHICLESDB-LICENSE.txt`)
- Scope: canonical makes and models for cars, motorcycles, mopeds, vans,
  trucks, and buses, reconciled from official registers in 14 countries.
- Required attribution: “Vehicle data by VehiclesDB (CC-BY 4.0), built from
  official public registers.”

## US EPA/DOE FuelEconomy.gov

- File: `epa-model-years.csv`
- Upstream: https://www.fueleconomy.gov/feg/epadata/vehicles.csv
- Source documentation: https://www.fueleconomy.gov/feg/ws/index.shtml
- License/status: United States Government public data.
- Snapshot date: 2026-07-29
- Transformation: only `make`, `model`, `year`, and `VClass` were retained;
  identical rows were removed. No engine, transmission, fuel, trim, VIN, or
  OEM data is imported.

EPA rows are stored as `VehicleGeneration.kind = MODEL_YEAR`. They are model
year compatibility slices, not claims about factory chassis/platform
generations. Real generations already present in the application remain
`GENERATION` and are never overwritten by this seed.
