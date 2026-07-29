import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import {
  CreateShopWarehouseDto,
  UpdateShopWarehouseDto,
} from './dto/shop-warehouse.dto';
import { ShopWarehousesService } from './shop-warehouses.service';

@ApiTags('Shop Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER)
@RequirePermissions(Permission.INVENTORY_UPDATE)
@Controller('shop-warehouses')
export class ShopWarehousesController {
  constructor(private readonly service: ShopWarehousesService) {}
  @Get() list(
    @Req() r: { user: InventoryActor },
    @Query('shopId') shopId?: string,
  ) {
    return this.service.list(r.user, shopId);
  }
  @Post() create(
    @Body() d: CreateShopWarehouseDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.create(d, r.user);
  }
  @Get(':id') one(@Param('id') id: string, @Req() r: { user: InventoryActor }) {
    return this.service.one(id, r.user);
  }
  @Patch(':id') update(
    @Param('id') id: string,
    @Body() d: UpdateShopWarehouseDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.update(id, d, r.user);
  }
  @Post(':id/set-default') setDefault(
    @Param('id') id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.setDefault(id, r.user);
  }
  @Post(':id/deactivate') deactivate(
    @Param('id') id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.deactivate(id, r.user);
  }
  @Post(':id/activate') activate(
    @Param('id') id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.activate(id, r.user);
  }
  @Delete(':id') remove(
    @Param('id') id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.remove(id, r.user);
  }
}
