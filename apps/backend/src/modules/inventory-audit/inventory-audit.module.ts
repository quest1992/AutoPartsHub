import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InventoryAuditController } from './inventory-audit.controller';
import { InventoryBalanceAuditService } from './inventory-balance-audit.service';
@Module({
  controllers: [InventoryAuditController],
  providers: [InventoryBalanceAuditService, RolesGuard],
})
export class InventoryAuditModule {}
