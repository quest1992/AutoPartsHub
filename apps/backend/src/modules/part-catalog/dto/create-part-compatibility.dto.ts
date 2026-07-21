import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreatePartCompatibilityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vehicleGenerationId!: string;

  @ApiPropertyOptional({ example: 2017, minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  yearFrom?: number;

  @ApiPropertyOptional({ example: 2024, minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  yearTo?: number;

  @ApiPropertyOptional({ example: 'Для кузова седан' })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;
}
