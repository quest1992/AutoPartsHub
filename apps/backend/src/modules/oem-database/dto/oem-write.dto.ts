import { PartialType } from '@nestjs/swagger';
import {
  OemContributionType,
  OemCrossReferenceType,
  OemFitmentPosition,
  OemPartAliasType,
  OemPartStatus,
  PartSide,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateOemPartDto {
  @IsString() number!: string;
  @IsOptional() @IsString() displayNumber?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(OemPartStatus) status?: OemPartStatus;
  @IsUUID() manufacturerId!: string;
  @IsString() sourceId!: string;
  @IsString() sourceKey!: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
export class UpdateOemPartDto extends PartialType(CreateOemPartDto) {}

export class AddOemAliasDto {
  @IsString() alias!: string;
  @IsEnum(OemPartAliasType) aliasType!: OemPartAliasType;
  @IsString() sourceId!: string;
}

export class AddOemCategoryDto {
  @IsUUID() catalogItemId!: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
  @IsInt() @Min(0) @Max(100) confidence!: number;
  @IsString() sourceId!: string;
}

export class AddOemFitmentDto {
  @IsUUID() manufacturerId!: string;
  @IsOptional() @IsUUID() vehicleModelId?: string;
  @IsOptional() @IsUUID() vehicleGenerationId?: string;
  @IsOptional() @IsUUID() vehicleSpecificationId?: string;
  @IsOptional() @IsInt() @Min(1886) @Max(2200) yearFrom?: number;
  @IsOptional() @IsInt() @Min(1886) @Max(2200) yearTo?: number;
  @IsOptional() @IsEnum(OemFitmentPosition) position?: OemFitmentPosition;
  @IsOptional() @IsEnum(PartSide) side?: PartSide;
  @IsOptional() @IsString() bodyType?: string;
  @IsOptional() @IsString() engineCode?: string;
  @IsOptional() @IsString() motorCode?: string;
  @IsOptional() @IsString() driveType?: string;
  @IsOptional() @IsString() notes?: string;
  @IsInt() @Min(0) @Max(100) confidence!: number;
  @IsString() sourceId!: string;
}

export class UpdateOemFitmentDto extends PartialType(AddOemFitmentDto) {}

export class AddOemCrossReferenceDto {
  @IsOptional() @IsUUID() toOemPartId?: string;
  @IsOptional() @IsUUID() partBrandId?: string;
  @IsOptional() @IsString() externalPartNumber?: string;
  @IsEnum(OemCrossReferenceType)
  relationType!: OemCrossReferenceType;
  @IsInt() @Min(0) @Max(100) confidence!: number;
  @IsString() sourceId!: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateOemContributionDto {
  @IsEnum(OemContributionType) type!: OemContributionType;
  @IsObject() payloadJson!: Record<string, unknown>;
}
