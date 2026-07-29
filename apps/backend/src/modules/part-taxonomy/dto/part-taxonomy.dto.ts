import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  PartCategoryClassification,
  PartPosition,
  PartSide,
  PartTaxonomyDecisionStatus,
  PartTaxonomyDuplicateStrategy,
  PartTaxonomyRiskLevel,
} from '@prisma/client';

const booleanValue = ({ value }: { value: unknown }) =>
  value === true || value === 'true'
    ? true
    : value === false || value === 'false'
      ? false
      : value;

export class TaxonomyCategoryQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() uuid?: string;
  @IsOptional() @IsUUID() rootCategoryId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) level?: number;
  @IsOptional() @Transform(booleanValue) @IsBoolean() isActive?: boolean;
  @IsOptional() @Transform(booleanValue) @IsBoolean() leafOnly?: boolean;
  @IsOptional() @Transform(booleanValue) @IsBoolean() hasItems?: boolean;
  @IsOptional() @Transform(booleanValue) @IsBoolean() hasMapping?: boolean;
  @IsOptional() @Transform(booleanValue) @IsBoolean() needsReview?: boolean;
  @IsOptional() @Transform(booleanValue) @IsBoolean() duplicates?: boolean;
  @IsOptional() @Transform(booleanValue) @IsBoolean() suspicious?: boolean;
  @IsOptional()
  @Transform(booleanValue)
  @IsBoolean()
  includeProcessed?: boolean;
  @IsOptional()
  @IsEnum(PartCategoryClassification)
  classification?: PartCategoryClassification;
  @IsOptional()
  @IsEnum(PartTaxonomyDecisionStatus)
  status?: PartTaxonomyDecisionStatus;
  @IsOptional() @IsString() sortBy?:
    'name' | 'path' | 'items' | 'children' | 'updatedAt' | 'risk';
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 25;
}

export class DecisionQueryDto {
  @IsOptional()
  @IsEnum(PartTaxonomyDecisionStatus)
  status?: PartTaxonomyDecisionStatus;
  @IsOptional()
  @IsEnum(PartCategoryClassification)
  classification?: PartCategoryClassification;
  @IsOptional()
  @IsEnum(PartTaxonomyRiskLevel)
  riskLevel?: PartTaxonomyRiskLevel;
  @IsOptional() @IsUUID() sourceCategoryId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 25;
}

export class CreateTaxonomyDecisionDto {
  @IsUUID() sourceCategoryId!: string;
  @IsEnum(PartCategoryClassification)
  classification!: PartCategoryClassification;
  @IsOptional() @IsUUID() targetCategoryId?: string;
  @IsOptional() @IsUUID() targetCatalogItemId?: string;
  @IsOptional() @IsString() @MinLength(2) canonicalName?: string;
  @IsOptional() @IsString() canonicalSlug?: string;
  @IsOptional() @IsEnum(PartSide) side?: PartSide;
  @IsOptional() @IsEnum(PartPosition) position?: PartPosition;
  @IsOptional() @IsString() unit?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  aliases?: string[];
  @IsOptional()
  @IsEnum(PartTaxonomyDuplicateStrategy)
  duplicateStrategy?: PartTaxonomyDuplicateStrategy;
  @IsOptional() @IsBoolean() deactivateSource?: boolean;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() reviewReason?: string;
}

export class UpdateTaxonomyDecisionDto extends CreateTaxonomyDecisionDto {
  @IsOptional() @IsUUID() declare sourceCategoryId: string;
  @IsOptional()
  @IsEnum(PartCategoryClassification)
  declare classification: PartCategoryClassification;
}

export class TaxonomyBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  decisionIds!: string[];
}

export class TaxonomyCsvImportDto {
  @IsString() @MinLength(1) csv!: string;
}
