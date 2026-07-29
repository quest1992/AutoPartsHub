import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { CreateInventoryTransferDto } from './dto/inventory-transfer.dto';
import { InventoryTransfersService } from './inventory-transfers.service';
@ApiTags('Inventory Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER)
@RequirePermissions(Permission.INVENTORY_QUANTITY_UPDATE)
@Controller('inventory-transfers')
export class InventoryTransfersController {
  constructor(private readonly service: InventoryTransfersService) {}
  @Post() create(
    @Body() dto: CreateInventoryTransferDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.create(dto, r.user);
  }
  @Get() list(
    @Query('shopId') shopId: string | undefined,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.list(r.user, shopId);
  }
  @Get(':id') one(@Param('id') id: string, @Req() r: { user: InventoryActor }) {
    return this.service.one(id, r.user);
  }
  @Post(':id/complete') complete(
    @Param('id') id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.complete(id, r.user);
  }
  @Post(':id/cancel') cancel(
    @Param('id') id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.cancel(id, r.user);
  }
}
