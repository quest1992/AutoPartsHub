import { createHash } from 'node:crypto';
import { PartCondition } from '@prisma/client';
import { normalizePartNumber } from './part-number-normalizer';

export function buildInventoryKey(input: {
  shopId: string;
  warehouseId?: string | null;
  partCatalogItemId: string;
  sku?: string | null;
  oemNumber?: string | null;
  brand?: string | null;
  condition?: PartCondition;
}) {
  const normalizedBrand =
    input.brand?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
  return createHash('md5')
    .update(
      [
        input.shopId,
        input.warehouseId ?? '',
        input.partCatalogItemId,
        normalizePartNumber(input.sku ?? '') ?? '',
        normalizePartNumber(input.oemNumber ?? '') ?? '',
        normalizedBrand,
        input.condition ?? PartCondition.NEW,
      ].join('|'),
    )
    .digest('hex');
}
