import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { MarketplaceSearchQueryDto } from './dto/marketplace-search-query.dto';
import { MarketplaceSearchService } from './marketplace-search.service';

@ApiTags('Marketplace Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.SHOP_ADMIN, UserRole.MANAGER, UserRole.SELLER, UserRole.VIEWER)
@Controller('marketplace-search')
export class MarketplaceSearchController {
  constructor(private readonly service: MarketplaceSearchService) {}

  @Get()
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Единый поиск по VIN, OEM, Cross и названию детали' })
  search(
    @Query() query: MarketplaceSearchQueryDto,
    @Req() request: { user: InventoryActor },
  ) {
    return this.service.search(query, request.user);
  }
}
