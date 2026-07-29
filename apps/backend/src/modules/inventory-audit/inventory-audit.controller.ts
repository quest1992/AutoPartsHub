import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryAuditQueryDto } from './dto/inventory-audit-query.dto';
import { InventoryBalanceAuditService } from './inventory-balance-audit.service';
@ApiTags('Admin Inventory Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/inventory-audit')
export class InventoryAuditController {
  constructor(private readonly service: InventoryBalanceAuditService) {}
  @Get() audit(@Query() query: InventoryAuditQueryDto) {
    return this.service.audit(query);
  }
}
