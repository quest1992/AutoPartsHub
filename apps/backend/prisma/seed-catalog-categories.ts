import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rootCategories = [
  ['Кузов', 'body'],
  ['Двигатель', 'engine'],
  ['Подвеска', 'suspension'],
  ['Тормозная система', 'brake-system'],
  ['Электрика', 'electrics'],
  ['Салон', 'interior'],
  ['Трансмиссия', 'transmission'],
  ['Рулевое управление', 'steering'],
  ['Охлаждение', 'cooling'],
] as const;

async function main() {
  for (const [sortOrder, [name, slug]] of rootCategories.entries()) {
    const existing = await prisma.partCategory.findFirst({
      where: {
        parentId: null,
        OR: [
          { slug: { equals: slug, mode: 'insensitive' } },
          { name: { equals: name, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.partCategory.update({
        where: { id: existing.id },
        data: { isActive: true, sortOrder },
      });
      continue;
    }

    await prisma.partCategory.create({
      data: {
        name,
        slug,
        sortOrder,
        parentId: null,
        isActive: true,
        needsReview: false,
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
