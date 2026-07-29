import { PayoutMethod, ShopPayableStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
class PayoutAllocationDto {
  @IsUUID() payableId!: string;
  @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
}
export class CreateShopPayoutDto {
  @IsUUID() shopId!: string;
  @IsEnum(PayoutMethod) method!: PayoutMethod;
  @IsOptional() @IsString() transactionReference?: string;
  @IsOptional() @IsString() note?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PayoutAllocationDto)
  allocations!: PayoutAllocationDto[];
}
export class CancelShopPayoutDto {
  @IsString() @MinLength(3) reason!: string;
}
export class ShopPayableQueryDto {
  @IsOptional() @IsUUID() shopId?: string;
  @IsOptional() @IsEnum(ShopPayableStatus) status?: ShopPayableStatus;
  @IsOptional() @IsUUID() customerOrderId?: string;
  @IsOptional() @IsUUID() saleId?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() onlyOutstanding?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
