import { Injectable } from '@nestjs/common';
import { PartPosition, PartSide } from '@prisma/client';
import {
  getPartNameTokens,
  normalizePartName,
} from '../../common/utils/part-name-normalizer';
import { CatalogSearchService } from '../part-catalog/catalog-search.service';
import { InventoryImportPreviewRow } from './types/inventory-import.types';

type Match = InventoryImportPreviewRow['match'];

@Injectable()
export class InventoryImportMatcherService {
  constructor(private readonly catalogSearch: CatalogSearchService) {}

  async match(
    name: string,
    side: PartSide,
    position: PartPosition,
  ): Promise<Match> {
    const normalizedName = normalizePartName(name);
    const searchResult = await this.catalogSearch.search({
      search: name,
      isActive: true,
      side: side === PartSide.NONE ? undefined : side,
      position: position === PartPosition.NONE ? undefined : position,
      limit: 6,
    });
    const items = searchResult.data;
    const categoryMatch = searchResult.categoryMatches?.[0];
    if (
      categoryMatch?.isLegacyCatalogItemCategory &&
      categoryMatch.mappedCatalogItemId
    ) {
      const mapped = items.find(
        (item) => item.id === categoryMatch.mappedCatalogItemId,
      );
      if (mapped)
        return {
          ...this.result('CATEGORY_MATCH', mapped, 1),
          categoryMatch: {
            categoryId: categoryMatch.categoryId,
            name: categoryMatch.name,
            mapped: true,
            message: `Legacy-категория сопоставлена с «${mapped.name}»`,
          },
        };
    }
    if (!items.length && categoryMatch)
      return {
        status: 'CATEGORY_MATCH',
        categoryMatch: {
          categoryId: categoryMatch.categoryId,
          name: categoryMatch.name,
          mapped: false,
          message:
            categoryMatch.catalogItemCount > 0
              ? 'Найдена категория, но не выбрана конкретная позиция каталога'
              : 'Найдена пустая категория без канонических позиций',
        },
      };
    if (!items.length) return { status: 'NOT_FOUND' };

    const ranked = items
      .map((item) => ({
        ...item,
        score: this.score(
          normalizedName,
          item.normalizedName,
          getPartNameTokens(name),
        ),
      }))
      .sort((left, right) => right.score - left.score);
    const exact = ranked.filter(
      (item) => item.normalizedName === normalizedName,
    );
    if (exact.length === 1) return this.result('EXACT', exact[0], 1);
    if (exact.length > 1) return this.multiple(exact, 1);
    if (ranked.length === 1 && ranked[0].score >= 0.65)
      return this.result('FUZZY', ranked[0], ranked[0].score);
    return this.multiple(ranked.slice(0, 5), ranked[0].score);
  }

  private score(query: string, candidate: string, tokens: string[]) {
    if (candidate.includes(query) || query.includes(candidate)) return 0.85;
    const matched = tokens.filter((token) => candidate.includes(token)).length;
    return Math.min(0.8, matched / Math.max(tokens.length, 1));
  }

  private result(
    status: 'EXACT' | 'ALIAS' | 'FUZZY' | 'CATEGORY_MATCH',
    item: { id: string; name: string; side: PartSide; position: PartPosition },
    score: number,
  ): Match {
    return {
      status,
      catalogItemId: item.id,
      catalogItemName: item.name,
      score,
      alternatives: [
        {
          catalogItemId: item.id,
          name: item.name,
          side: item.side,
          position: item.position,
          score,
        },
      ],
    };
  }

  private multiple(
    items: Array<{
      id: string;
      name: string;
      side: PartSide;
      position: PartPosition;
      score?: number;
    }>,
    score: number,
  ): Match {
    return {
      status: 'MULTIPLE',
      score,
      alternatives: items.map((item) => ({
        catalogItemId: item.id,
        name: item.name,
        side: item.side,
        position: item.position,
        score: item.score ?? score,
      })),
    };
  }
}
