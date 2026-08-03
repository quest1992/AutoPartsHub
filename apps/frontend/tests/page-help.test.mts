import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(
  new URL("../app/layout.tsx", import.meta.url),
  "utf8",
);
const helper = readFileSync(
  new URL("../components/page-help.tsx", import.meta.url),
  "utf8",
);

test("root layout exposes contextual help on every protected page", () => {
  assert.match(layout, /<PageHelp \/>/);
  assert.match(helper, /Как пользоваться/);
  assert.match(helper, /Подбор запчастей по автомобилю/);
  assert.match(helper, /Мои заявки на новые запчасти/);
  assert.match(helper, /Справочники автомобилей/);
  assert.match(helper, /OEM и совместимость/);
});

test("help dialog is keyboard accessible and does not cover public auth pages", () => {
  assert.match(helper, /Escape/);
  assert.match(helper, /role="dialog"/);
  assert.match(helper, /pathname ===/);
});
