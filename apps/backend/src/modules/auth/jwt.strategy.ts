import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../users/users.service';
import { getJwtSecret } from './jwt-secret';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: {
    sub: string;
    phone: string;
    role: string;
    shopId: string | null;
  }) {
    if (!payload.sub) {
      throw new UnauthorizedException('Недействительный токен');
    }

    const user = await this.usersService.findAuthUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Пользователь больше не имеет доступа');
    }

    if (user.shopId && (!user.shop || !user.shop.isActive)) {
      throw new UnauthorizedException('Магазин пользователя отключён');
    }

    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      shopId: user.shopId,
    };
  }
}
