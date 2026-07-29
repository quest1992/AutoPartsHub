import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PartCatalogSuggestionsController } from './part-catalog-suggestions.controller';
import { PartCatalogSuggestionsService } from './part-catalog-suggestions.service';
import { PartCatalogModule } from '../part-catalog/part-catalog.module';

@Module({
  imports: [PartCatalogModule],
  controllers: [PartCatalogSuggestionsController],
  providers: [PartCatalogSuggestionsService, RolesGuard],
})
export class PartCatalogSuggestionsModule {}
