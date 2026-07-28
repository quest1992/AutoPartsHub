import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional() @IsString() @Length(2, 100) firstName?: string;
  @IsOptional() @IsString() @Length(2, 100) lastName?: string;
  @IsOptional() @IsString() @Length(5, 30) phone?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
