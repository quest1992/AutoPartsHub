import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateVehicleGenerationDto {
  @ApiProperty({
    example: 'XV70',
    description: 'Название поколения автомобиля',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiProperty({
    example: 'xv70',
    description: 'Slug поколения латинскими буквами',
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
    description: 'ID модели автомобиля',
  })
  @IsUUID()
  vehicleModelId!: string;

  @ApiPropertyOptional({
    example: 'Восьмое поколение Toyota Camry',
    description: 'Описание поколения',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  description?: string;

  @ApiPropertyOptional({ example: 2017, description: 'Год начала выпуска' })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  startYear?: number;

  @ApiPropertyOptional({ example: 2024, description: 'Год окончания выпуска' })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  endYear?: number;

  @ApiPropertyOptional({ example: true, description: 'Активно ли поколение' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
