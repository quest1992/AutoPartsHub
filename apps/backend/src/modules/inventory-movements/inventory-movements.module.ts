import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InventoryMovementsController } from './inventory-movements.controller';
import { InventoryMovementsService } from './inventory-movements.service';
@Module({
  controllers: [InventoryMovementsController],
  providers: [InventoryMovementsService, RolesGuard],
})
export class InventoryMovementsModule {}
