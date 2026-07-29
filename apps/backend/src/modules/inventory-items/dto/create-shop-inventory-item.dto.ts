import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartCondition } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateShopInventoryItemDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Только SUPER_ADMIN' })
  @IsOptional()
  @IsUUID()
  shopId?: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() partCatalogItemId!: string;
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Если не указан, используется основной склад',
  })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  brand?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 100) sku?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  oemNumber?: string;
  @ApiPropertyOptional({ enum: PartCondition, default: PartCondition.NEW })
  @IsOptional()
  @IsEnum(PartCondition)
  condition?: PartCondition;
  @ApiProperty({ example: 1200, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
  @ApiPropertyOptional({ default: 'TJS' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minQuantity?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  location?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;
  @ApiPropertyOptional({
    description: 'Свободное описание совместимости с автомобилями',
    example: 'Toyota Camry XV50 2012–2017, двигатель 2.5',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  compatibility?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
