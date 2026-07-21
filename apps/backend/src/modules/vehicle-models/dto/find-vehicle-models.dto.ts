import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class FindVehicleModelsDto {
  @ApiPropertyOptional({
    description: 'Фильтр по ID производителя',
    example: 'b6e7c83a-2d36-4cc2-a525-90bb30d15aad',
  })
  @IsOptional()
  @IsUUID()
  manufacturerId?: string;

  @ApiPropertyOptional({
    description: 'Фильтр по активности модели',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Поиск по названию или slug',
    example: 'camry',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;
}
