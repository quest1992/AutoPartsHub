import { UnauthorizedException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { rolePermissions } from '../../common/permissions/role-permissions';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByPhone(loginDto.phone);

    if (!user) {
      throw new UnauthorizedException('Неверный номер телефона или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    if (user.shopId && (!user.shop || !user.shop.isActive)) {
      throw new UnauthorizedException('Магазин пользователя отключён');
    }

    const passwordIsValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Неверный номер телефона или пароль');
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      shopId: user.shopId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        shopId: user.shopId,
      },
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findCurrentUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Пользователь больше не имеет доступа');
    }

    return { user: { ...user, permissions: rolePermissions[user.role] ?? [] } };
  }
}
