import { PartNumberType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreatePartNumberDto {
  @ApiProperty({ example: '04465-0K240' })
  @IsString()
  @Length(1, 255)
  rawNumber!: string;

  @ApiProperty({ enum: PartNumberType, example: PartNumberType.OEM })
  @IsEnum(PartNumberType)
  type!: PartNumberType;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  brand?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
