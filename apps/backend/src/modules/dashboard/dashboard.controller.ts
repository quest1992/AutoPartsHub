import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/permissions/require-permissions.decorator';
import { Permission } from '../../common/permissions/permission.enum';
import { PermissionsGuard } from '../../common/permissions/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryActor } from '../inventory-items/inventory-items.service';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.SHOP_ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
  UserRole.VIEWER,
)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get('summary')
  @RequirePermissions(Permission.DASHBOARD_VIEW)
  @ApiOperation({ summary: 'Сводная аналитика магазина или всех магазинов' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Некорректный период' })
  @ApiResponse({ status: 401, description: 'JWT отсутствует или невалиден' })
  @ApiResponse({
    status: 403,
    description: 'Нет доступа к выбранному магазину',
  })
  summary(
    @Query() query: DashboardSummaryQueryDto,
    @Req() request: { user: InventoryActor },
  ) {
    return this.dashboardService.summary(query, request.user);
  }
}
