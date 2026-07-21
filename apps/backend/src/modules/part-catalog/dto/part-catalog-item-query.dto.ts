import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartPosition, PartSide } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;
const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value) : value;

export class PartCatalogItemQueryDto {
  @ApiPropertyOptional({
    description: 'Поиск по названию, slug или внутреннему коду',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  search?: string;

  @ApiPropertyOptional({
    example: 'PRT-000001',
    description: 'Точный внутренний код',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  internalCode?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Категория и все её потомки',
  })
  @IsOptional()
  @IsUUID()
  rootCategoryId?: string;

  @ApiPropertyOptional({ enum: PartSide })
  @IsOptional()
  @IsEnum(PartSide)
  side?: PartSide;

  @ApiPropertyOptional({ enum: PartPosition })
  @IsOptional()
  @IsEnum(PartPosition)
  position?: PartPosition;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleGenerationId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleModelId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  manufacturerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isUniversal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
