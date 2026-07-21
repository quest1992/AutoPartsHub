import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { InventorySearchController } from './inventory-search.controller';
import { InventorySearchService } from './inventory-search.service';
@Module({
  controllers: [InventorySearchController],
  providers: [InventorySearchService, RolesGuard],
})
export class InventorySearchModule {}
