import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateVehicleModelDto {
  @ApiProperty({
    example: 'Camry',
    description: 'Название модели автомобиля',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiProperty({
    example: 'camry',
    description: 'Slug модели латинскими буквами',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug должен содержать только маленькие латинские буквы, цифры и дефисы',
  })
  slug!: string;

  @ApiProperty({
    example: 'b6e7c83a-2d36-4cc2-a525-90bb30d15aad',
    description: 'ID производителя автомобиля',
  })
  @IsUUID()
  manufacturerId!: string;

  @ApiPropertyOptional({
    example: 'Среднеразмерный седан Toyota',
    description: 'Описание модели',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Активна ли модель',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
