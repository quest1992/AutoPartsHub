import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  firstName!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(8, 100)
  @Matches(/[A-Za-zА-Яа-я]/, {
    message: 'Пароль должен содержать хотя бы одну букву',
  })
  @Matches(/[0-9]/, {
    message: 'Пароль должен содержать хотя бы одну цифру',
  })
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsUUID()
  shopId?: string;
}
