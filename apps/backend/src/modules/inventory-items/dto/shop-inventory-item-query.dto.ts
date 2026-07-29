import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartCondition } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
const bool = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;
const num = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value) : value;
export class ShopInventoryItemQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  shopId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  partCatalogItemId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  rootCategoryId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  manufacturerId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleModelId?: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vehicleGenerationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() oemNumber?: string;
  @ApiPropertyOptional({ enum: PartCondition })
  @IsOptional()
  @IsEnum(PartCondition)
  condition?: PartCondition;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(num)
  @IsNumber()
  @Min(0)
  minPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(num)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(bool)
  @IsBoolean()
  inStock?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(bool)
  @IsBoolean()
  lowStock?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(bool)
  @IsBoolean()
  hasReservation?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(bool)
  @IsBoolean()
  isActive?: boolean;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(num)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Transform(num)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
