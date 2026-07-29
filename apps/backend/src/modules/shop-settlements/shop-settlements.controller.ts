import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
  CancelShopPayoutDto,
  CreateShopPayoutDto,
  ShopPayableQueryDto,
} from './dto/shop-settlement.dto';
import { ShopSettlementsService } from './shop-settlements.service';
@ApiTags('Shop settlements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER)
@Controller()
export class ShopSettlementsController {
  constructor(private readonly s: ShopSettlementsService) {}
  @Get('shop-payables') @RequirePermissions(Permission.FINANCE_VIEW) payables(
    @Query() q: ShopPayableQueryDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.payables(q, r.user);
  }
  @Get('shop-payables/:id')
  @RequirePermissions(Permission.FINANCE_VIEW)
  payable(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.payable(id, r.user);
  }
  @Get('shop-payouts') @RequirePermissions(Permission.FINANCE_VIEW) payouts(
    @Query('shopId') shopId: string | undefined,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.payouts(r.user, shopId);
  }
  @Post('shop-payouts')
  @RequirePermissions(Permission.SHOP_PAYOUT_MANAGE)
  create(@Body() d: CreateShopPayoutDto, @Req() r: { user: InventoryActor }) {
    return this.s.createPayout(d, r.user);
  }
  @Get('shop-payouts/:id') @RequirePermissions(Permission.FINANCE_VIEW) payout(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.payout(id, r.user);
  }
  @Post('shop-payouts/:id/complete')
  @RequirePermissions(Permission.SHOP_PAYOUT_MANAGE)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.completePayout(id, r.user);
  }
  @Post('shop-payouts/:id/cancel')
  @RequirePermissions(Permission.SHOP_PAYOUT_MANAGE)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: CancelShopPayoutDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.cancelPayout(id, d, r.user);
  }
  @Get('shops/:id/financial-balance')
  @RequirePermissions(Permission.FINANCE_VIEW)
  balance(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.balance(id, r.user);
  }
}
