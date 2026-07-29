import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ShopWarehousesController } from './shop-warehouses.controller';
import { ShopWarehousesService } from './shop-warehouses.service';
@Module({
  controllers: [ShopWarehousesController],
  providers: [ShopWarehousesService, RolesGuard],
  exports: [ShopWarehousesService],
})
export class ShopWarehousesModule {}
