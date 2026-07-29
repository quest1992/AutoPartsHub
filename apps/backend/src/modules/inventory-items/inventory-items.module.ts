import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InventoryItemsController } from './inventory-items.controller';
import { InventoryItemsService } from './inventory-items.service';
import { InventoryImageService } from './inventory-image.service';
import { ShopWarehousesModule } from '../shop-warehouses/shop-warehouses.module';
@Module({
  imports: [ShopWarehousesModule],
  controllers: [InventoryItemsController],
  providers: [InventoryItemsService, InventoryImageService, RolesGuard],
  exports: [InventoryItemsService],
})
export class InventoryItemsModule {}
