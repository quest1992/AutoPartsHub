import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryMovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  NotEquals,
} from 'class-validator';
export class ChangeQuantityDto {
  @ApiProperty({ example: -1 })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  change!: number;
  @ApiProperty({ enum: InventoryMovementType })
  @IsEnum(InventoryMovementType)
  type!: InventoryMovementType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reference?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;
}
