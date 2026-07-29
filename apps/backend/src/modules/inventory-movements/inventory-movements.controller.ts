import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { InventoryMovementQueryDto } from './dto/inventory-movement-query.dto';
import { InventoryMovementsService } from './inventory-movements.service';
@ApiTags('Inventory Movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller()
export class InventoryMovementsController {
  constructor(private s: InventoryMovementsService) {}
  @Get('inventory-movements')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Неизменяемый журнал движений' })
  all(
    @Query() q: InventoryMovementQueryDto,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.findAll(q, r.user);
  }
  @Get('inventory-movements/:id')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  one(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.findOne(id, r.user);
  }
  @Get('inventory-items/:inventoryItemId/movements')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  byItem(
    @Param('inventoryItemId', ParseUUIDPipe) id: string,
    @Req() r: { user: InventoryActor },
  ) {
    return this.s.byItem(id, r.user);
  }
}
