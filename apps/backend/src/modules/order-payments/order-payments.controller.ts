import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import {
  CancelOrderPaymentDto,
  CreateOrderPaymentDto,
  RefundOrderPaymentDto,
} from './dto/order-payment.dto';
import { OrderPaymentsService } from './order-payments.service';
@ApiTags('Order payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER)
@RequirePermissions(Permission.ORDER_PAYMENT_MANAGE)
@Controller('customer-orders/:orderId')
export class OrderPaymentsController {
  constructor(private readonly service: OrderPaymentsService) {}
  @Get('payments') list(
    @Param('orderId', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.list(id, r.user);
  }
  @Post('payments') create(
    @Param('orderId', ParseUUIDPipe) id: string,
    @Body() d: CreateOrderPaymentDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.create(id, d, r.user);
  }
  @Post('payments/:paymentId/cancel') cancel(
    @Param('orderId', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() d: CancelOrderPaymentDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.cancel(id, paymentId, d, r.user);
  }
  @Post('refunds') refund(
    @Param('orderId', ParseUUIDPipe) id: string,
    @Body() d: RefundOrderPaymentDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.refund(id, d, r.user);
  }
}
