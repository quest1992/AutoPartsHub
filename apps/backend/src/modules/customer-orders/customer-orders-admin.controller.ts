import { Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderReservationExpirationService } from './order-reservation-expiration.service';

@ApiTags('Customer orders admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/customer-orders')
export class CustomerOrdersAdminController {
  constructor(private readonly expiration: OrderReservationExpirationService) {}
  @Post('release-expired') releaseExpired() {
    return this.expiration.releaseExpired();
  }
}
