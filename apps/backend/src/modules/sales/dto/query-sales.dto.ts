import { SaleStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
const n = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? Number(value) : value;
export class QuerySalesDto {
  @IsOptional() @Transform(n) @IsInt() @Min(1) page?: number;
  @IsOptional() @Transform(n) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(SaleStatus) status?: SaleStatus;
  @IsOptional() @IsUUID() shopId?: string;
  @IsOptional() @IsUUID() userId?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
  @IsOptional() @Transform(n) @Min(0) minTotal?: number;
  @IsOptional() @Transform(n) @Min(0) maxTotal?: number;
  @IsOptional() @IsString() sortBy?: 'createdAt' | 'totalAmount' | 'number';
  @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
}
