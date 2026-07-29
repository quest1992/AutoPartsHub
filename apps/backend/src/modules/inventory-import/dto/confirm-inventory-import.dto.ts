import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import type {
  DuplicateAction,
  ImportMode,
} from '../types/inventory-import.types';

export class PreviewInventoryImportDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Обязателен для SUPER_ADMIN',
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;
}

export class ConfirmInventoryImportRowDto {
  @ApiProperty()
  @IsInt()
  @Min(2)
  rowNumber!: number;

  @ApiProperty()
  @IsBoolean()
  include!: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  catalogItemId?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  salePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  article?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oem?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ enum: ['MERGE_QUANTITY', 'KEEP_FIRST', 'KEEP_ALL'] })
  @IsOptional()
  @IsEnum(['MERGE_QUANTITY', 'KEEP_FIRST', 'KEEP_ALL'])
  duplicateAction?: DuplicateAction;
}

export class ConfirmInventoryImportDto {
  @ApiProperty({
    enum: ['ADD_QUANTITY', 'REPLACE_QUANTITY'],
    default: 'ADD_QUANTITY',
  })
  @IsEnum(['ADD_QUANTITY', 'REPLACE_QUANTITY'])
  mode: ImportMode = 'ADD_QUANTITY';

  @ApiProperty({ type: [ConfirmInventoryImportRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmInventoryImportRowDto)
  rows!: ConfirmInventoryImportRowDto[];
}
