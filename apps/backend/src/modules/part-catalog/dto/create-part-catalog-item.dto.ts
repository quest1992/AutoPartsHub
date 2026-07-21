import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartPosition, PartSide } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreatePartCatalogItemDto {
  @ApiProperty({ example: 'Колодки тормозные передние' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name!: string;

  @ApiProperty({
    example: 'front-brake-pads',
    description: 'Slug приводится к нижнему регистру',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @ApiPropertyOptional({ example: 'Комплект передних тормозных колодок' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 1000)
  description?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID конечной активной категории деталей',
  })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ enum: PartSide, default: PartSide.NONE })
  @IsOptional()
  @IsEnum(PartSide)
  side?: PartSide;

  @ApiPropertyOptional({ enum: PartPosition, default: PartPosition.NONE })
  @IsOptional()
  @IsEnum(PartPosition)
  position?: PartPosition;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isUniversal?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
