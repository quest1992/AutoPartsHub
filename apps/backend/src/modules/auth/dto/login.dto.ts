import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '+992900001122',
    description: 'Номер телефона пользователя',
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 30)
  phone!: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Пароль пользователя',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 100)
  password!: string;
}
