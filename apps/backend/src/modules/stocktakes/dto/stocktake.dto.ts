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
export class CreateStocktakeDto {
  @IsOptional() @IsUUID() shopId?: string;
  @IsUUID() warehouseId!: string;
  @IsOptional() @IsString() note?: string;
}
class StocktakeCountDto {
  @IsUUID() inventoryItemId!: string;
  @Type(() => Number) @IsInt() @Min(0) actualQuantity!: number;
}
export class UpdateStocktakeItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StocktakeCountDto)
  items!: StocktakeCountDto[];
}
