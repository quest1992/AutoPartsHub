import { PartNumberType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { IsOptional } from 'class-validator';

export class CreatePartNumberDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  catalogItemId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  manufacturerId!: string;

  @ApiProperty({ example: '90915-YZZE1' })
  @IsString()
  @MinLength(1)
  number!: string;

  @ApiProperty({ enum: PartNumberType })
  @IsEnum(PartNumberType)
  type!: PartNumberType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
