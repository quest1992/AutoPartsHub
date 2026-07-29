import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { ShopWarehousesModule } from '../shop-warehouses/shop-warehouses.module';
@Module({
  imports: [ShopWarehousesModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
})
export class PurchasesModule {}
