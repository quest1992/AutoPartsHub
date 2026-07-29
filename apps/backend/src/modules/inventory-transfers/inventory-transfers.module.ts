import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InventoryTransfersController } from './inventory-transfers.controller';
import { InventoryTransfersService } from './inventory-transfers.service';
@Module({
  controllers: [InventoryTransfersController],
  providers: [InventoryTransfersService, RolesGuard],
})
export class InventoryTransfersModule {}
