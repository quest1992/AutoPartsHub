import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InventoryItemsController } from './inventory-items.controller';
import { InventoryItemsService } from './inventory-items.service';
@Module({
  controllers: [InventoryItemsController],
  providers: [InventoryItemsService, RolesGuard],
  exports: [InventoryItemsService],
})
export class InventoryItemsModule {}
