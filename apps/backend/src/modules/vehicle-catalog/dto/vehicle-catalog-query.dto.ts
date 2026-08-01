import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class VehicleCatalogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class VehicleCatalogItemsQueryDto extends VehicleCatalogQueryDto {
  @ApiPropertyOptional({ enum: ['price', 'availability', 'name'] })
  @IsOptional()
  @IsIn(['price', 'availability', 'name'])
  sort: 'price' | 'availability' | 'name' = 'price';
}
