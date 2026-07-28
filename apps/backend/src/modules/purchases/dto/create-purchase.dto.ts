import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseLineDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() inventoryItemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() catalogItemId?: string;
  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @Min(0)
  purchasePrice!: number;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  salePrice?: number;
}

export class CreatePurchaseDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() shopId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ default: 'TJS' })
  @IsOptional()
  @IsString()
  currency?: string;
  @ApiPropertyOptional({ example: '2026-07-19T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  purchasedAt?: string;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  discount?: number;
  @ApiProperty({ type: [PurchaseLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  items!: PurchaseLineDto[];
}
