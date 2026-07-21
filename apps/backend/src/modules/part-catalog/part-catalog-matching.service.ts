import { Injectable } from '@nestjs/common';
import { normalizePartName } from '../../common/utils/part-name-normalizer';
import { normalizePartNumber } from '../../common/utils/part-number-normalizer';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MatchPartInput,
  PartMatchMethod,
  PartMatchResult,
} from './types/part-match.types';

const notFound = (requiresReview = false): PartMatchResult => ({
  matched: false,
  partCatalogItemId: null,
  method: 'NOT_FOUND',
  confidence: 0,
  requiresReview,
});

@Injectable()
export class PartCatalogMatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPartNumber(partNumber: string): Promise<string[]> {
    const normalizedNumber = normalizePartNumber(partNumber);
    if (!normalizedNumber) return [];

    const matches = await this.prisma.partNumber.findMany({
      where: {
        normalizedNumber,
        partCatalogItem: { isActive: true },
      },
      select: { partCatalogItemId: true },
    });
    return this.uniqueIds(matches);
  }

  async findByAlias(alias: string): Promise<string[]> {
    const normalizedAlias = normalizePartName(alias);
    if (!normalizedAlias) return [];

    const matches = await this.prisma.partAlias.findMany({
      where: {
        normalizedAlias,
        isApproved: true,
        partCatalogItem: { isActive: true },
      },
      select: { partCatalogItemId: true },
    });
    return this.uniqueIds(matches);
  }

  async findByCanonicalName(name: string): Promise<string[]> {
    const normalizedName = normalizePartName(name);
    if (!normalizedName) return [];

    const matches = await this.prisma.partCatalogItem.findMany({
      where: { normalizedName, isActive: true },
      select: { id: true },
    });
    return [...new Set(matches.map((match) => match.id))];
  }

  async match(input: MatchPartInput): Promise<PartMatchResult> {
    let requiresReview = false;

    if (input.partNumber) {
      const partNumberMatches = await this.findByPartNumber(input.partNumber);
      const result = this.toResult(partNumberMatches, 'OEM_EXACT', 1);
      if (result) return result;
      requiresReview ||= partNumberMatches.length > 1;
    }

    if (input.name) {
      const aliasMatches = await this.findByAlias(input.name);
      const aliasResult = this.toResult(aliasMatches, 'ALIAS_EXACT', 0.9);
      if (aliasResult) return aliasResult;
      requiresReview ||= aliasMatches.length > 1;

      const nameMatches = await this.findByCanonicalName(input.name);
      const nameResult = this.toResult(nameMatches, 'NAME_EXACT', 0.8);
      if (nameResult) return nameResult;
      requiresReview ||= nameMatches.length > 1;
    }

    return notFound(requiresReview);
  }

  private toResult(
    matches: string[],
    method: Exclude<PartMatchMethod, 'NOT_FOUND'>,
    confidence: number,
  ): PartMatchResult | null {
    if (matches.length !== 1) return null;

    return {
      matched: true,
      partCatalogItemId: matches[0],
      method,
      confidence,
      requiresReview: false,
    };
  }

  private uniqueIds(matches: Array<{ partCatalogItemId: string }>): string[] {
    return [...new Set(matches.map((match) => match.partCatalogItemId))];
  }
}
