import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
class InventoryTransferLineDto {
  @IsUUID() sourceInventoryItemId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}
export class CreateInventoryTransferDto {
  @IsOptional() @IsUUID() shopId?: string;
  @IsUUID() fromWarehouseId!: string;
  @IsUUID() toWarehouseId!: string;
  @IsOptional() @IsString() note?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InventoryTransferLineDto)
  items!: InventoryTransferLineDto[];
}
