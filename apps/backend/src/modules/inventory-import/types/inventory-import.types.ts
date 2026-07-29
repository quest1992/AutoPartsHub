import { PartPosition, PartSide } from '@prisma/client';

export type MatchStatus =
  'EXACT' | 'ALIAS' | 'FUZZY' | 'MULTIPLE' | 'CATEGORY_MATCH' | 'NOT_FOUND';
export type ValidationStatus = 'VALID' | 'NEEDS_REVIEW' | 'ERROR' | 'DUPLICATE';
export type DuplicateAction = 'MERGE_QUANTITY' | 'KEEP_FIRST' | 'KEEP_ALL';
export type ImportMode = 'ADD_QUANTITY' | 'REPLACE_QUANTITY';

export interface ImportSourceRow {
  name: string;
  article?: string;
  oem?: string;
  category?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  yearFrom?: number;
  yearTo?: number;
  side?: string;
  position?: string;
  quantity: number;
  salePrice: number;
  purchasePrice?: number;
  manufacturer?: string;
  warehouse?: string;
  note?: string;
}

export interface InventoryImportPreviewRow {
  rowNumber: number;
  source: ImportSourceRow;
  normalized: {
    name: string;
    normalizedName: string;
    side: PartSide;
    position: PartPosition;
    warehouseId?: string;
    warehouseName?: string;
  };
  match: {
    status: MatchStatus;
    catalogItemId?: string;
    catalogItemName?: string;
    score?: number;
    categoryMatch?: {
      categoryId: string;
      name: string;
      mapped: boolean;
      message: string;
    };
    alternatives?: Array<{
      catalogItemId: string;
      name: string;
      side: PartSide;
      position: PartPosition;
      score: number;
    }>;
  };
  validation: {
    status: ValidationStatus;
    errors: string[];
    warnings: string[];
  };
}
