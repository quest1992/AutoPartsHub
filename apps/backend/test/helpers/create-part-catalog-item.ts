import { Prisma, PrismaClient } from '@prisma/client';
import {
  getPartNameSearchTokens,
  normalizePartName,
} from '../../src/common/utils/part-name-normalizer';

export function createPartCatalogItem(
  prisma: PrismaClient,
  args: Prisma.PartCatalogItemCreateArgs,
) {
  const data = args.data as Prisma.PartCatalogItemUncheckedCreateInput;

  return prisma.partCatalogItem.create({
    ...args,
    data: {
      ...data,
      normalizedName: normalizePartName(data.name),
      searchTokens: getPartNameSearchTokens(data.name),
    },
  });
}
