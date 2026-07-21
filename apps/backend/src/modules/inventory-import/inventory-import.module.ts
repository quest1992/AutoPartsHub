import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PartCatalogModule } from '../part-catalog/part-catalog.module';
import { InventoryImportController } from './inventory-import.controller';
import { InventoryImportService } from './inventory-import.service';

@Module({
  imports: [PartCatalogModule],
  controllers: [InventoryImportController],
  providers: [InventoryImportService, RolesGuard],
})
export class InventoryImportModule {}
