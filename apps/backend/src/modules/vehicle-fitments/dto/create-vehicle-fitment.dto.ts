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

export class CreateVehicleFitmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  catalogItemId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  engineId!: string;

  @ApiPropertyOptional({ example: 2017 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  yearFrom?: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  yearTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;
}
