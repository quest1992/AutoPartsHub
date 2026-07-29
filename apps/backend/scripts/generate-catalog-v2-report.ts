import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  catalogV2,
  CatalogV2Node,
  getCatalogV2Stats,
} from '../src/part-categories/data/catalog-v2';

function renderTree(nodes: CatalogV2Node[], depth = 0): string[] {
  return nodes.flatMap((node) => [
    `${'  '.repeat(depth)}- ${node.name} (\`${node.slug}\`)`,
    ...renderTree(node.children ?? [], depth + 1),
  ]);
}

async function main() {
  const stats = getCatalogV2Stats();
  const outputPath = resolve('docs/CATALOG_V2.md');
  const document = `# Catalog v2

Catalog v2 is a standalone reference taxonomy proposal. It is not imported from
the legacy catalog and is not activated automatically.

## Summary

- Root categories: ${stats.roots}
- Grouping categories: ${stats.groups}
- Part types: ${stats.partTypes}
- Total categories: ${stats.totalCategories}
- Maximum depth: ${stats.maxDepth}

The \`name\` field is the canonical Russian category name. Every node also has a
stable slug and description in the source file.

## Full tree

${renderTree(catalogV2).join('\n')}

## Legacy concepts intentionally excluded

- Position-specific categories such as front/rear, left/right, upper/lower and
  inner/outer. Position belongs to product attributes.
- Colloquial spellings and abbreviations as separate categories.
- Make-, model- and generation-specific branches. Applicability belongs to
  vehicle fitment.
- OEM numbers, cross references and manufacturer article numbers as categories.
- Duplicate branches that differ only by wording, assembly side or vehicle.

## Duplicate prevention decisions

- One canonical leaf is used for a part type; synonyms belong to aliases/search.
- Parent groups provide context without repeating positional variants.
- Root slugs use the \`catalog-v2-\` namespace so the proposal can coexist with
  the current catalog before a controlled cutover.
- Validation enforces unique sibling names and paths, descriptions, valid slugs,
  the three-level limit and the forbidden position-word rule.
`;

  await mkdir(resolve('docs'), { recursive: true });
  await writeFile(outputPath, document, 'utf8');
  process.stdout.write(`Generated ${outputPath}\n`);
}

void main();
