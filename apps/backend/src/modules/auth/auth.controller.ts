import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    phone: string;
    role: string;
    shopId: string | null;
  };
}

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Войти по номеру телефона и паролю',
  })
  @ApiOkResponse({
    description: 'Авторизация выполнена успешно',
  })
  @ApiUnauthorizedResponse({
    description: 'Неверный номер телефона или пароль',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить данные текущего пользователя',
  })
  @ApiOkResponse({
    description: 'Данные пользователя успешно получены',
  })
  @ApiUnauthorizedResponse({
    description: 'Пользователь не авторизован',
  })
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.user.id);
  }
}
