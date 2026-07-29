import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartPosition, PartSide } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

export class ApprovePartCatalogSuggestionDto {
  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: PartSide })
  @IsOptional()
  @IsEnum(PartSide)
  side?: PartSide;

  @ApiPropertyOptional({ enum: PartPosition })
  @IsOptional()
  @IsEnum(PartPosition)
  position?: PartPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isUniversal?: boolean;
}
