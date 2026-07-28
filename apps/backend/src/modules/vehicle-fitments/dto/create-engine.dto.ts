import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateEngineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  generationId!: string;

  @ApiProperty({ example: '2AR-FE' })
  @IsString()
  @Length(1, 50)
  code!: string;

  @ApiProperty({ example: '2.5 бензин' })
  @IsString()
  @Length(1, 150)
  name!: string;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(20)
  volume?: number;

  @ApiProperty({ example: 'PETROL' })
  @IsString()
  @Length(1, 40)
  fuel!: string;

  @ApiPropertyOptional({ example: 181 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3000)
  power?: number;
}
