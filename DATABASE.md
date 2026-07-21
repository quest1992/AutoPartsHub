# DATABASE.md — целевая БД

Документ описывает направление. Сначала сравнивай с текущей `apps/backend/prisma/schema.prisma`. Не заменяй схему целиком.

## Текущая база

Ожидаются:
- Shop
- User
- Category
- Manufacturer
- VehicleModel
- UserRole

Фактические поля и миграции проверять в проекте.

## Следующие сущности

### VehicleGeneration
`id, name, code?, vehicleModelId, productionStartYear?, productionEndYear?, description?, isActive, createdAt, updatedAt`

### Engine
`id, manufacturerId?, code, name, fuelType, displacementCc?, powerHp?, description?, isActive, createdAt, updatedAt`

### VehicleModification
`id, vehicleGenerationId, engineId?, name, bodyType?, driveType?, transmissionType?, productionStartYear?, productionEndYear?, isActive, timestamps`

### Part
`id, internalCode, name, normalizedName, slug?, description?, categoryId, unit, isActive, timestamps`

### PartSynonym
`id, partId, value, normalizedValue, type, createdAt`

### PartNumber
`id, partId, value, type, partBrandId?, isActive, timestamps`

Типы номеров: OEM, AFTERMARKET, SUPPLIER, BARCODE.

### PartCompatibility
Связь Part с manufacturer/model/generation/modification. Не допускать противоречивых комбинаций.

### PartBrand
Производитель запчасти, не путать с Manufacturer автомобиля.

### Warehouse
`id, shopId, name, address?, isActive, timestamps`

### InventoryItem
`id, shopId, warehouseId?, partId, partBrandId?, sku?, condition, quantity, reservedQuantity, price Decimal, currency, notes?, isActive, lastStockUpdateAt, timestamps`

### Reservation
`id, inventoryItemId, quantity, status, customerName?, customerPhone?, expiresAt?, createdById, timestamps`

### Sale
`id, shopId, status, customerName?, customerPhone?, currency, totalAmount Decimal, createdById, timestamps`

### SaleItem
`id, saleId, inventoryItemId, partNameSnapshot, quantity, unitPrice Decimal, lineTotal Decimal`

## Enum-кандидаты

UserRole, PartCondition, Currency, ReservationStatus, SaleStatus, FuelType, DriveType, TransmissionType, BodyType, PartNumberType, SynonymType.

Добавлять только когда реально используется модулем.

## Деньги

Не Float. Рекомендуемый вариант:
```prisma
Decimal @db.Decimal(12, 2)
```
Точность согласовать с реальными суммами.

## Индексы

Индексировать foreign keys и частые фильтры: shopId, categoryId, manufacturerId, vehicleModelId, normalizedName, sku, isActive, lastStockUpdateAt.

## Миграции

- Одно логическое изменение — одна миграция.
- Понятное английское имя.
- Сначала format/validate.
- Проверять SQL рискованных миграций.
- Не редактировать применённые миграции.
- Не использовать reset.
- После migrate — generate и build.

## Транзакции

Обязательны для продаж, резервов, отмен, импорта и массового изменения остатков.

## AuditLog позже

Хранить actor, action, entityType, entityId, before/after JSON, createdAt. Не журналировать пароли и JWT.
