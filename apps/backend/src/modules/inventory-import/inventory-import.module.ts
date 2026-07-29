import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InventoryImportController } from './inventory-import.controller';
import { InventoryImportMatcherService } from './inventory-import-matcher.service';
import { InventoryImportSmartParserService } from './inventory-import-smart-parser.service';
import { InventoryImportService } from './inventory-import.service';
import { ShopWarehousesModule } from '../shop-warehouses/shop-warehouses.module';
import { PartCatalogModule } from '../part-catalog/part-catalog.module';

@Module({
  imports: [ShopWarehousesModule, PartCatalogModule],
  controllers: [InventoryImportController],
  providers: [
    InventoryImportService,
    InventoryImportSmartParserService,
    InventoryImportMatcherService,
    RolesGuard,
  ],
})
export class InventoryImportModule {}
