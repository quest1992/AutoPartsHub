import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/catalog-picker.tsx", import.meta.url),
  "utf8",
);

test("new catalog suggestions search and preselect an empty category", () => {
  assert.match(source, /categorySearch\.trim\(\)/);
  assert.match(
    source,
    /getPartCategories\(\{[\s\S]*search: categorySearch\.trim\(\),[\s\S]*limit: 50,[\s\S]*leafOnly: true/,
  );
  assert.doesNotMatch(source, /getPartCategories\(\{ limit: 100/);
  assert.match(source, /category\.parent\.name/);
  assert.match(source, /openForm\(match\)/);
  assert.match(source, /suggestedCategoryId: match\?\.categoryId/);
  assert.match(source, /categoryMatchLabels\.suggest/);
});
