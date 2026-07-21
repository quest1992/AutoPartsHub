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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CancelPurchaseDto } from './dto/cancel-purchase.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { QueryPurchasesDto } from './dto/query-purchases.dto';
import { PurchasesService } from './purchases.service';
@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller('purchases')
export class PurchasesController {
  constructor(private s: PurchasesService) {}
  @Post()
  @RequirePermissions(Permission.PURCHASES_CREATE)
  @ApiOperation({ summary: 'Оформить приход товара' })
  @ApiResponse({ status: 201 })
  create(@Body() d: CreatePurchaseDto, @Req() r: { user: InventoryActor }) {
    return this.s.create(d, r.user);
  }
  @Get() @RequirePermissions(Permission.PURCHASES_VIEW) @ApiOperation({ summary: 'Список закупок' }) all(
    @Query() q: QueryPurchasesDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.all(r.user, q);
  }
  @Get(':id')
  @RequirePermissions(Permission.PURCHASES_VIEW)
  @ApiOperation({ summary: 'Закупка по ID' })
  @ApiParam({ name: 'id' })
  one(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.one(id, r.user);
  }
  @Post(':id/cancel') @RequirePermissions(Permission.PURCHASES_CANCEL) @ApiOperation({ summary: 'Отменить закупку' }) cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() d: CancelPurchaseDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.cancel(id, d, r.user);
  }
}
