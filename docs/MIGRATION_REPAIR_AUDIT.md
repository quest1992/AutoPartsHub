# Prisma migration dependency audit

Дата проверки: 2026-07-29.

## Результат

Полная цепочка проверена фактическим `prisma migrate deploy` на отдельной пустой
PostgreSQL database. После repair все 44 migration применяются, повторный deploy
не имеет pending migration, а `prisma migrate diff` не обнаруживает отличий от
`schema.prisma`.

Найден один случай использования таблицы до её создания:

```text
20260728165224_add_customer_orders_and_reservations
  CustomerOrderItem_warehouseId_fkey
    -> shop_warehouses(id)

20260728210000_add_shop_warehouses
  CREATE TABLE shop_warehouses
```

Других forward dependencies для таблиц, FK, индексов, enum, функций и триггеров
фактический fresh deploy не выявил.

## Граф основных зависимостей

```text
Shop
├── User
├── ShopInventoryItem ── PartCatalogItem ── PartCategory
│   └── InventoryMovement
├── Purchase ── PurchaseItem
├── Sale ── SaleItem
└── shop_warehouses
    ├── ShopInventoryItem.warehouseId
    ├── InventoryMovement.warehouseId
    ├── CustomerOrderItem.warehouseId
    ├── InventoryTransfer
    └── Stocktake

Customer
└── CustomerOrder
    ├── CustomerOrderItem
    ├── CustomerOrderStatusHistory
    ├── CustomerOrderPayment
    ├── Sale
    └── ShopPayable ── ShopPayoutAllocation ── ShopPayout

Manufacturer
└── VehicleModel
    └── VehicleGeneration
        ├── PartCompatibility
        ├── VehicleFitment
        ├── Engine
        └── VehicleModification

PartCategory
├── PartCatalogItem
│   ├── PartAlias
│   ├── PartNumber
│   ├── PartCategoryCatalogItemMapping
│   └── PartTaxonomyDecision
└── PartTaxonomyDecision
```

## Проверенные migration-фазы

| Диапазон | Создаваемые/изменяемые объекты | Основные зависимости |
|---|---|---|
| `20260718063844`–`20260718122726` | Shop, Category, User/UserRole, Manufacturer, VehicleModel | базовые таблицы |
| `20260718190004`–`20260718194141` | VehicleGeneration, PartCategory, PartCatalogItem, PartCompatibility | VehicleModel, PartCategory |
| `20260718200239`–`20260719055204` | inventory, movements, sales, purchases и enums | Shop, User, PartCatalogItem |
| `20260719120000`–`20260720175549` | role enum, normalization, aliases/numbers, import, moderation | User, catalog |
| `20260722194829`–`20260726130000` | moderation, compatibility, images, fitments, VIN, manufacturers | catalog и vehicle |
| `20260728132118`–`20260728133945` | suggestions, pg_trgm и GIN indexes | catalog, pg_trgm |
| `20260728164000` | repair shim/marker | fresh DB only |
| `20260728165224`–`20260728180000` | customers, orders, reservations, import sessions | warehouse shim, Shop, User, inventory |
| `20260728205000` | release repair shim | fresh DB marker only |
| `20260728210000` | настоящие warehouses и transfers | Shop, inventory, movements |
| `20260728211000` | восстановление order→warehouse FK | real warehouse table |
| `20260728213000`–`20260728235900` | inventory keys, stocktakes, constraints | warehouse/inventory/orders |
| `20260729070000`–`20260729071000` | taxonomy mapping, redirects, function/trigger | category/catalog/User |
| `20260729120000` | vehicle foundation, audit tables | vehicle/User |
| `20260729200000` | finance enums/tables/FK/backfill | orders/sales/shops/User |
| `20260729223000` | Taxonomy Studio | category/catalog/User |
| `20260729224000` | canonical index names | existing indexes only |

## Repair protocol

1. `20260728164000_prepare_shop_warehouse_dependency`
   создаёт минимальную shim-таблицу и marker только если `shop_warehouses`
   отсутствует. На production это no-op.
2. `20260728205000_release_shop_warehouse_dependency`
   при наличии marker удаляет временный FK и shim непосредственно перед
   неизменённой warehouse migration.
3. Оригинальная `20260728210000_add_shop_warehouses` создаёт полную таблицу.
4. `20260728211000_restore_shop_warehouse_dependency`
   восстанавливает FK и удаляет marker.
5. `20260729224000_align_generated_index_names`
   переименовывает два индекса без перестроения пользовательских данных.

Существующие migration-файлы не изменялись, не переименовывались и не
удалялись.

## Автоматические проверки

```powershell
npm run test:migrations:fresh
npm run test:migrations:snapshot -- <custom-format-backup.dump>
```

Fresh verifier создаёт БД с `test` в имени, выполняет deploy/status,
validate/generate, проверяет schema drift и удаляет временную БД в `finally`.
Snapshot verifier восстанавливает backup в отдельную test DB, сравнивает
контрольные показатели до/после, проверяет drift и удаляет test DB.
