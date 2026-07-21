# DEVELOPMENT_WORKFLOW.md

## Установка контекста

1. Распаковать архив.
2. Скопировать все `.md` в:
   `D:\Projects\AutoPartsHub`
3. В VS Code: `File → Open Folder`.
4. Выбрать `D:\Projects\AutoPartsHub`.
5. Открыть панель Codex.
6. Начать новый чат Codex.

## Первый запрос Codex

```text
Сначала полностью прочитай AGENTS.md и остальные markdown-документы в корне проекта.

Проведи аудит AutoPartsHub. На этом шаге ничего не изменяй.

Проверь:
1. структуру;
2. apps/backend/package.json;
3. apps/frontend/package.json;
4. apps/backend/prisma/schema.prisma;
5. Prisma migrations;
6. apps/backend/src/app.module.ts;
7. Users, Shops, Auth, Categories, Manufacturers, Vehicle Models;
8. JWT, guards, roles и Swagger;
9. ошибки TypeScript;
10. возможность backend build.

Все backend-команды выполняй из:
D:\Projects\AutoPartsHub\apps\backend

Не используй prisma migrate reset.
Не удаляй данные или миграции.
Не меняй .env.
Не вноси изменения.

В конце дай отчёт в формате AGENTS.md и предложи один следующий безопасный шаг.
```

## После аудита

```text
Прочитай AGENTS.md.

Исправь только блокирующие ошибки из аудита.
Не добавляй крупные функции.
Не используй reset, не удаляй данные, миграции и не меняй .env.
После изменений выполни проверки из AGENTS.md и дай полный отчёт.
```

## Завершение Vehicle Models

```text
Прочитай AGENTS.md, PROJECT_CONTEXT.md, BUSINESS_RULES.md и DATABASE.md.

Изучи текущий ManufacturersModule и используй его стиль.

Заверши Vehicle Models:
- create/update DTO;
- service;
- controller;
- module;
- подключение в app.module.ts, если нужно;
- проверка производителя;
- предотвращение дубля name/slug внутри производителя;
- CRUD;
- фильтр manufacturerId;
- isActive;
- роли/авторизация в стиле проекта;
- Swagger.

Не меняй schema.prisma, если VehicleModel уже корректна.
Не создавай миграцию без изменения схемы.
Не используй migrate reset.

После работы выполни проверки из AGENTS.md и дай инструкцию проверки Swagger.
```

## Безопасные разрешения

Обычно можно разрешать:
- чтение и редактирование внутри AutoPartsHub;
- npm/npx команды build, validate, generate;
- запуск тестов.

Остановиться перед:
- удалением;
- reset БД;
- изменением `.env`;
- установкой неизвестных пакетов;
- командами вне проекта;
- git reset/clean/force.

## Проверка результата

1. Посмотреть diff.
2. Убедиться, что `.env` не менялся.
3. Проверить список файлов.
4. Проверить build.
5. Запустить backend.
6. Открыть Swagger.
7. Проверить endpoint.
8. Только затем продолжать.

## Backend-команды

```powershell
cd D:\Projects\AutoPartsHub\apps\backend
npm run start:dev
npx prisma format
npx prisma validate
npx prisma generate
npm run build
npx prisma studio
```

Миграция только при реальном изменении:
```powershell
npx prisma migrate dev --name meaningful_name
```

## Что присылать в основной чат

Присылай итог Codex, ошибки терминала, список изменённых файлов и скрин Swagger. Весь проект копировать не нужно.
