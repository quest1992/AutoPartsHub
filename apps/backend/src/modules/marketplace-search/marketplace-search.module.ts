import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VinModule } from '../vin/vin.module';
import { MarketplaceSearchController } from './marketplace-search.controller';
import { MarketplaceSearchService } from './marketplace-search.service';

@Module({
  imports: [VinModule],
  controllers: [MarketplaceSearchController],
  providers: [MarketplaceSearchService, RolesGuard],
})
export class MarketplaceSearchModule {}
