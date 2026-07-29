import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VinModule } from '../vin/vin.module';
import { PartCatalogModule } from '../part-catalog/part-catalog.module';
import { MarketplaceSearchController } from './marketplace-search.controller';
import { MarketplaceSearchService } from './marketplace-search.service';

@Module({
  imports: [VinModule, PartCatalogModule],
  controllers: [MarketplaceSearchController],
  providers: [MarketplaceSearchService, RolesGuard],
})
export class MarketplaceSearchModule {}
