import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateManufacturerDto {
  @ApiProperty({
    example: 'Toyota',
    description: 'Название производителя автомобиля',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiProperty({
    example: 'toyota',
    description: 'Уникальный slug латинскими буквами',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug должен содержать только маленькие латинские буквы, цифры и дефисы',
  })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Япония',
    description: 'Страна производителя',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;

  @ApiPropertyOptional({
    example: 'Японский производитель автомобилей',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  description?: string;
}
