import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateEmployeeDto {
  @IsString() @Length(2, 100) firstName!: string;
  @IsOptional() @IsString() @Length(2, 100) lastName?: string;
  @IsString() @Length(5, 30) phone!: string;
  @IsEnum(UserRole) role!: UserRole;
  @IsString() @Length(8, 100) temporaryPassword!: string;
  @IsOptional() @IsUUID() shopId?: string;
}
