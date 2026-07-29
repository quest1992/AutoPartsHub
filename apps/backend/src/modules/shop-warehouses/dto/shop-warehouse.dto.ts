import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateShopWarehouseDto {
  @IsString() @Length(1, 120) name!: string;
  @IsOptional() @IsString() @Length(1, 40) code?: string;
  @IsOptional() @IsString() @Length(1, 300) address?: string;
  @IsOptional() @IsString() @Length(1, 1000) note?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsUUID() shopId?: string;
}
export class UpdateShopWarehouseDto extends PartialType(
  CreateShopWarehouseDto,
) {}
