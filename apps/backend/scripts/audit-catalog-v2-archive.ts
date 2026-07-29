import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

type ForeignKeyRow = {
  childTable: string;
  childColumn: string;
  targetTable: 'PartCategory' | 'PartCatalogItem';
  deleteAction: string;
};

const prisma = new PrismaClient();

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function main() {
  const foreignKeys = await prisma.$queryRaw<ForeignKeyRow[]>`
    SELECT
      child.relname AS "childTable",
      child_column.attname AS "childColumn",
      target.relname AS "targetTable",
      fk.confdeltype::text AS "deleteAction"
    FROM pg_constraint fk
    JOIN pg_class child ON child.oid = fk.conrelid
    JOIN pg_class target ON target.oid = fk.confrelid
    JOIN LATERAL unnest(fk.conkey) WITH ORDINALITY AS child_key(attnum, position)
      ON true
    JOIN pg_attribute child_column
      ON child_column.attrelid = child.oid
      AND child_column.attnum = child_key.attnum
    WHERE fk.contype = 'f'
      AND target.relname IN ('PartCategory', 'PartCatalogItem')
    ORDER BY target.relname, child.relname, child_column.attname
  `;

  const references: Array<ForeignKeyRow & { archivedReferences: number }> = [];
  for (const foreignKey of foreignKeys) {
    const childTable = quoteIdentifier(foreignKey.childTable);
    const childColumn = quoteIdentifier(foreignKey.childColumn);
    const targetTable = quoteIdentifier(foreignKey.targetTable);
    const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint AS count
       FROM ${childTable} child
       JOIN ${targetTable} target ON target.id = child.${childColumn}
       WHERE target."isActive" = false`,
    );
    references.push({
      ...foreignKey,
      archivedReferences: Number(rows[0]?.count ?? 0n),
    });
  }

  const archivedItems = await prisma.partCatalogItem.findMany({
    where: { isActive: false },
    select: {
      id: true,
      internalCode: true,
      name: true,
      normalizedName: true,
      slug: true,
      category: { select: { id: true, name: true, slug: true } },
      _count: {
        select: {
          aliases: true,
          partNumbers: true,
          compatibilities: true,
          vehicleFitments: true,
          shopInventoryItems: true,
          saleItems: true,
          purchaseItems: true,
          customerOrderItems: true,
          inventoryTransferItems: true,
          categoryMappings: true,
          taxonomyDecisions: true,
          partCatalogSuggestions: true,
          replacements: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        archivedCategories: await prisma.partCategory.count({
          where: { isActive: false },
        }),
        archivedCatalogItems: archivedItems.length,
        archivedAliases: await prisma.partAlias.count({
          where: { partCatalogItem: { isActive: false } },
        }),
        taxonomy: {
          mappings: await prisma.partCategoryCatalogItemMapping.count(),
          decisions: await prisma.partTaxonomyDecision.count(),
          auditEvents: await prisma.partTaxonomyAuditEvent.count(),
        },
        references,
        referencedArchivedItems: archivedItems.filter((item) =>
          Object.entries(item._count).some(
            ([relation, count]) =>
              relation !== 'aliases' && relation !== 'partNumbers' && count > 0,
          ),
        ),
      },
      null,
      2,
    )}\n`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
