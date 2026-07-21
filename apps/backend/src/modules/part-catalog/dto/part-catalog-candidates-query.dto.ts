import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartPosition, PartSide } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value) : value;

export class PartCatalogCandidatesQueryDto {
  @ApiProperty({ description: 'Название детали для поиска кандидатов' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  q!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: PartSide })
  @IsOptional()
  @IsEnum(PartSide)
  side?: PartSide;

  @ApiPropertyOptional({ enum: PartPosition })
  @IsOptional()
  @IsEnum(PartPosition)
  position?: PartPosition;

  @ApiPropertyOptional({ default: 10, maximum: 25 })
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(25)
  limit?: number;
}
