import {
  Body,
  Controller,
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
  CreateStocktakeDto,
  UpdateStocktakeItemsDto,
} from './dto/stocktake.dto';
import { StocktakesService } from './stocktakes.service';
@ApiTags('Stocktakes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER)
@RequirePermissions(Permission.INVENTORY_QUANTITY_UPDATE)
@Controller('stocktakes')
export class StocktakesController {
  constructor(private readonly service: StocktakesService) {}
  @Post() create(
    @Body() dto: CreateStocktakeDto,
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
  @Patch(':id/items') updateItems(
    @Param('id') id: string,
    @Body() dto: UpdateStocktakeItemsDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.service.updateItems(id, dto, r.user);
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
