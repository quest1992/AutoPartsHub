import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
const bool = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;
const num = ({ value }: { value: unknown }) => Number(value);
export class InventoryAuditQueryDto {
  @IsOptional() @IsUUID() shopId?: string;
  @IsOptional() @IsUUID() warehouseId?: string;
  @IsOptional() @IsUUID() inventoryItemId?: string;
  @IsOptional() @Transform(bool) @IsBoolean() onlyMismatches?: boolean;
  @IsOptional() @Transform(num) @IsInt() @Min(1) page = 1;
  @IsOptional() @Transform(num) @IsInt() @Min(1) @Max(100) limit = 20;
}
