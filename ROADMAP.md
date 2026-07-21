# ROADMAP.md

## 0. Аудит
Проверить структуру, package.json, schema, migrations, app.module, auth, Swagger и build. Исправить только блокирующие ошибки.

## 1. Vehicle Models
DTO, service, controller, module, manufacturer validation, duplicate handling, filter, roles, Swagger, build.

## 2. Vehicle Generations
Модель, безопасная миграция, CRUD, годы, связь, проверки.

## 3. Engines и Modifications
Сначала определить минимальные поля для реального рынка.

## 4. Центральный Part
Категория, внутренний код, каноническое и нормализованное имя, единица, isActive, админский CRUD.

## 5. Синонимы и номера
PartSynonym, OEM, aftermarket, поиск похожих.

## 6. Compatibility
Сначала manufacturer/model, позже generation/modification.

## 7. Warehouse и Inventory
Склад, цена, количество, резерв, состояние, бренд, изоляция магазинов.

## 8. Глобальный поиск
Деталь, применяемость, магазин, город, доступно, цена, дата обновления.

## 9. Reservations и Sales
Транзакции, статусы, защита остатка, история цен.

## 10. Analytics
Магазин и SUPER_ADMIN.

## 11. Excel/CSV
Шаблон, upload, preview, validation, mapping, confirmation, report.

## 12. Frontend MVP
Login, dashboard, shops, users, categories, manufacturers, models, parts, inventory, search, sales.

## 13. Production
Secrets, backups, HTTPS, migrations, logging, monitoring.

## 14. VIN
Только после исследования поставщиков, цен, лицензий и покрытия китайских автомобилей.

Правило: один завершённый модуль за одну задачу. Не делать весь проект одним запросом.
