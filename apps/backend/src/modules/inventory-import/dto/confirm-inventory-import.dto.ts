import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class PreviewInventoryImportDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Обязателен для SUPER_ADMIN',
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Колонка с артикулом / OEM / SKU',
    example: 'Артикул',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  partNumberColumn?: string;

  @ApiPropertyOptional({
    description: 'Колонка с наименованием товара',
    example: 'Наименование',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  nameColumn?: string;

  @ApiPropertyOptional({ description: 'Колонка с ценой', example: 'Цена' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  priceColumn?: string;

  @ApiPropertyOptional({
    description: 'Колонка с количеством',
    example: 'Остаток',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  quantityColumn?: string;
}

export class ConfirmInventoryImportDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Обязателен для SUPER_ADMIN',
  })
  @IsOptional()
  @IsUUID()
  shopId?: string;

  @ApiPropertyOptional({
    description: 'Колонка с артикулом / OEM / SKU',
    example: 'Артикул',
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  partNumberColumn?: string;

  @ApiProperty({
    description: 'Колонка с наименованием товара',
    example: 'Наименование',
  })
  @IsString()
  @Length(1, 200)
  nameColumn!: string;

  @ApiProperty({ description: 'Колонка с ценой', example: 'Цена' })
  @IsString()
  @Length(1, 200)
  priceColumn!: string;

  @ApiProperty({ description: 'Колонка с количеством', example: 'Остаток' })
  @IsString()
  @Length(1, 200)
  quantityColumn!: string;
}
