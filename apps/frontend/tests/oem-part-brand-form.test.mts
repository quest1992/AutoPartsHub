import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(
  new URL("../app/admin/oem/page.tsx", import.meta.url),
  "utf8",
);

test("external OEM number requires a part brand and explains an empty registry", () => {
  assert.match(page, /if \(!cross\.partBrandId\)/);
  assert.match(page, /Справочник производителей деталей пуст/);
  assert.match(page, /disabled=\{\s*!cross\.partBrandId \|\|/);
});
