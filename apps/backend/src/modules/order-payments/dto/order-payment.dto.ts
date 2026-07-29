import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
export class CreateOrderPaymentDto {
  @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @IsEnum(PaymentMethod) method!: PaymentMethod;
  @IsOptional() @IsString() transactionReference?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsDateString() receivedAt?: string;
}
export class CancelOrderPaymentDto {
  @IsString() @MinLength(3) reason!: string;
}
export class RefundOrderPaymentDto {
  @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @IsOptional() @IsEnum(PaymentMethod) method?: PaymentMethod;
  @IsString() @MinLength(3) reason!: string;
  @IsOptional() @IsString() originalPaymentId?: string;
}
