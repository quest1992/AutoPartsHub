import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateShopDto {
  @ApiProperty({
    example: 'Auto Parts Khujand',
    description: 'Название магазина',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional({
    example: 'Усмон Исмонов',
    description: 'Имя владельца',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  ownerName?: string;

  @ApiPropertyOptional({
    example: '+992900001122',
    description: 'Номер телефона',
  })
  @IsOptional()
  @IsString()
  @Length(5, 30)
  phone?: string;

  @ApiPropertyOptional({
    example: '+992900001122',
    description: 'Номер WhatsApp',
  })
  @IsOptional()
  @IsString()
  @Length(5, 30)
  whatsapp?: string;

  @ApiPropertyOptional({
    example: 'shop@example.com',
    description: 'Электронная почта',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'Таджикистан',
    description: 'Страна',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;

  @ApiPropertyOptional({
    example: 'Худжанд',
    description: 'Город',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @ApiPropertyOptional({
    example: 'ул. Исмоили Сомони, 25',
    description: 'Адрес магазина',
  })
  @IsOptional()
  @IsString()
  @Length(2, 255)
  address?: string;

  @ApiPropertyOptional({
    example: 40.2826,
    description: 'Широта',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 69.6222,
    description: 'Долгота',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
