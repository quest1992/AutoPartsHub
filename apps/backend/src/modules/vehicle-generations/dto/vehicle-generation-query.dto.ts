import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value) : value;

export class VehicleGenerationQueryDto {
  @ApiPropertyOptional({
    example: 'xv70',
    description: 'Поиск по name или slug',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @ApiPropertyOptional({ description: 'Фильтр по ID модели автомобиля' })
  @IsOptional()
  @IsUUID()
  vehicleModelId?: string;

  @ApiPropertyOptional({ description: 'Фильтр по ID производителя автомобиля' })
  @IsOptional()
  @IsUUID()
  manufacturerId?: string;

  @ApiPropertyOptional({ example: true, description: 'Фильтр по активности' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 2017,
    description: 'Начало искомого периода',
  })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1900)
  @Max(2100)
  startYear?: number;

  @ApiPropertyOptional({ example: 2024, description: 'Конец искомого периода' })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1900)
  @Max(2100)
  endYear?: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Номер страницы',
  })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
    description: 'Записей на странице',
  })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
