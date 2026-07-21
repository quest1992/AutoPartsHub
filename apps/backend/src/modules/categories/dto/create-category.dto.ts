import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Тормозная система',
    description: 'Название категории',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiProperty({
    example: 'brake-system',
    description: 'Уникальный адрес категории латинскими буквами',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'slug должен содержать только маленькие латинские буквы, цифры и дефисы',
  })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Детали тормозной системы автомобиля',
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'ID родительской категории для создания подкатегории',
    example: 'b6e7c83a-2d36-4cc2-a525-90bb30d15aad',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
