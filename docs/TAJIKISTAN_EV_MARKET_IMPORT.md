# Tajikistan EV Market Import — Production Guide

## Что делает импорт

V1 сопоставляет taxonomy snapshot рынка Таджикистана с существующими
производителями, добавляет только отсутствующие `VehicleModel` и безопасные
alias. Новые производители не создаются.

V2 рассматривает только модели, помеченные source reference Somon.tj, и
добавляет `VehicleGeneration`/`VehicleSpecification` исключительно при строгом
совпадении с проверенными источниками проекта. Fitment, OEM, Inventory,
Catalog, API и frontend не изменяются.

Обе команды работают в режиме plan по умолчанию. Только команда `:apply`
передаёт флаг `--apply` и разрешает транзакцию записи. То же правило действует
при `NODE_ENV=production`.

## Рекомендуемый production workflow (Railway)

1. Создайте backup PostgreSQL и проверьте возможность восстановления.
2. Убедитесь, что migrations текущего deploy применены.
3. Запустите `npm run tajikistan-ev-market:plan` и сохраните вывод.
4. Проверьте source, license, snapshot metadata, `Added`, `Aliases`, `Skipped`.
5. Запустите `npm run tajikistan-ev-market:apply`.
6. Убедитесь, что автоматический post-apply dry-run показывает 0 моделей и 0 alias.
7. Запустите `npm run tajikistan-ev-market-v2:plan`.
8. После проверки выполните `npm run tajikistan-ev-market-v2:apply`.
9. Убедитесь, что post-apply dry-run V2 показывает 0 поколений и спецификаций.

Команды необходимо запускать из `apps/backend` либо через Railway service,
рабочей директорией которого является `apps/backend`.

## Backup

Перед apply рекомендуется Railway database backup/snapshot. Дополнительно можно
использовать существующую команду проекта:

```powershell
npm run db:backup
```

Храните backup вне ephemeral filesystem контейнера и проверьте, что файл не
пустой. Не запускайте `prisma migrate reset`.

## Откат

Seed намеренно не выполняет автоматическое удаление: модели могут уже иметь
связи. Безопасный откат — восстановить production PostgreSQL из backup,
созданного непосредственно перед apply.

Если восстановление всей БД недопустимо, остановитесь и подготовьте отдельный
проверяемый rollback-скрипт по `sourceRefs`/`sourceKey`. Не удаляйте записи
вручную без проверки связей и не используйте `git reset` как способ отката БД.

## Лицензия и границы данных

Somon.tj используется только как reference taxonomy рынка. Импорт не копирует
объявления, цены, фотографии, телефоны или описания продавцов. Перед apply CLI
печатает источник, режим лицензии, назначение и точный scope импортируемых
данных.
