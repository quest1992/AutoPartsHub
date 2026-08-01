import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL(
  "../components/vehicle-quick-search.tsx",
  import.meta.url,
);
const pagePath = new URL("../app/vehicles/page.tsx", import.meta.url);
const apiPath = new URL("../lib/api.ts", import.meta.url);

test("quick search is a freeSolo debounced autocomplete with all user states", async () => {
  const source = await readFile(componentPath, "utf8");
  assert.match(source, /freeSolo/);
  assert.match(source, /350/);
  assert.match(source, /AbortController/);
  assert.match(source, /Автомобили не найдены/);
  assert.match(source, /Не удалось выполнить поиск/);
  assert.match(source, /loading=\{active&&loading\}/);
  assert.match(source, /Введите марку или модель/);
  assert.match(source, /minHeight:56/);
  assert.match(source, /width:'100%'/);
});

test("quick search uses typed API and keeps the step-by-step picker", async () => {
  const [page, api] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(apiPath, "utf8"),
  ]);
  assert.match(page, /VehicleQuickSearch/);
  assert.match(page, /label=["']Производитель["']/);
  assert.match(page, /label=["']Модель["']/);
  assert.match(page, /Популярные электромобили/);
  assert.match(page, /priorityGroup/);
  assert.match(page, /Другие производители/);
  assert.match(page, /filterOptions=\{\(options\) => options\}/);
  assert.match(
    page,
    /getVehicleManufacturers\(manufacturerQuery, 1, 100, controller\.signal\)/,
  );
  assert.match(page, /Производители не найдены/);
  assert.match(page, /Загрузка производителей/);
  assert.match(page, /getVehicleCatalogStats\(controller\.signal\)/);
  assert.match(page, /catalogStats\?\.manufacturers/);
  assert.match(page, /catalogStats\?\.models/);
  assert.match(page, /catalogStats\?\.specifications/);
  assert.match(api, /vehicles\/stats/);
  assert.match(api, /vehicleCatalogQuickSearch/);
  assert.match(api, /encodeURIComponent\(query\)/);
  assert.match(api, /signal\?: AbortSignal/);
});
