export type PartMatchMethod =
  'OEM_EXACT' | 'ALIAS_EXACT' | 'NAME_EXACT' | 'NOT_FOUND';

export interface MatchPartInput {
  partNumber?: string | null;
  name?: string | null;
}

export interface PartMatchResult {
  matched: boolean;
  partCatalogItemId: string | null;
  method: PartMatchMethod;
  confidence: number;
  requiresReview: boolean;
}
