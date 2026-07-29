import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePartCatalogSuggestionDto {
  @ApiProperty({ example: 'Колодки тормозные передние' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '04465-33480' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  oemNumber?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  suggestedCategoryId?: string;
}
