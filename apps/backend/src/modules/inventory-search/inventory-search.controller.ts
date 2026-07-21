import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { InventorySearchQueryDto } from './dto/inventory-search-query.dto';
import { InventorySearchService } from './inventory-search.service';
@ApiTags('Inventory Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@ApiUnauthorizedResponse({ description: 'Требуется JWT' })
@ApiForbiddenResponse({ description: 'Доступ ограничен своим магазином' })
@Controller('inventory-search')
export class InventorySearchController {
  constructor(private readonly service: InventorySearchService) {}
  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Глобальный поиск складских остатков' })
  search(
    @Query() query: InventorySearchQueryDto,
    @Req() req: { user: InventoryActor },
  ) {
    return this.service.search(query, req.user);
  }
}
