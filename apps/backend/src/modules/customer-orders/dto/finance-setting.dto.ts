import { ShopCommissionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
export class UpdateShopCommissionDto {
  @IsEnum(ShopCommissionType) commissionType!: ShopCommissionType;
  @Type(() => Number) @IsNumber() @Min(0) commissionValue!: number;
}
export class UpdatePlatformOrderSettingDto {
  @IsEnum(ShopCommissionType) defaultCommissionType!: ShopCommissionType;
  @Type(() => Number) @IsNumber() @Min(0) defaultCommissionValue!: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(10080)
  reservationMinutes?: number;
  @IsOptional() @IsString() currencyCode?: string;
}
