import {
  OrderCommissionType,
  OrderDeliveryType,
  OrderPaymentStatus,
} from '@prisma/client';
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

class CustomerSnapshotDto {
  @IsString() @MinLength(2) fullName!: string;
  @IsOptional() @IsString() phone?: string;
}
class CustomerOrderLineDto {
  @IsUUID() inventoryItemId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @Type(() => Number) @IsNumber() @Min(0) unitPrice!: number;
  @IsOptional()
  @IsEnum(OrderCommissionType)
  commissionType?: OrderCommissionType;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commissionValue?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  clientUnitPrice?: number;
}
export class CreateCustomerOrderDto {
  @IsOptional() @IsUUID() customerId?: string;
  @ValidateNested()
  @Type(() => CustomerSnapshotDto)
  customer!: CustomerSnapshotDto;
  @IsEnum(OrderDeliveryType) deliveryType!: OrderDeliveryType;
  @IsOptional() @IsString() deliveryAddress?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) deliveryFee?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsString() note?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CustomerOrderLineDto)
  items!: CustomerOrderLineDto[];
}
export class UpdateCustomerOrderDto {
  @IsOptional() @IsEnum(OrderDeliveryType) deliveryType?: OrderDeliveryType;
  @IsOptional() @IsString() deliveryAddress?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) deliveryFee?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discount?: number;
  @IsOptional() @IsEnum(OrderPaymentStatus) paymentStatus?: OrderPaymentStatus;
  @IsOptional() @IsString() note?: string;
}
export class ReserveOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(10080)
  expiresInMinutes?: number;
}
export class ExtendReservationDto {
  @Type(() => Number) @IsInt() @Min(15) @Max(10080) expiresInMinutes!: number;
}
export class CancelCustomerOrderDto {
  @IsString() @MinLength(3) reason!: string;
}
export class CustomerOrderQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() paymentStatus?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() shopId?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() expired?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
export class OrderInventorySearchDto {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsUUID() shopId?: string;
  @IsOptional() @IsUUID() warehouseId?: string;
  @IsOptional() @IsUUID() catalogItemId?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() onlyAvailable?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
