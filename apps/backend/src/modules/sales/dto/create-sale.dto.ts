import { Type } from 'class-transformer';
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
export class SaleLineDto {
  @IsUUID() inventoryItemId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}
export class CreateSaleDto {
  @IsOptional() @IsUUID() shopId?: string;
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() soldAt?: string;
  @IsOptional() @Type(() => Number) @Min(0) discount?: number;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleLineDto)
  items!: SaleLineDto[];
}
