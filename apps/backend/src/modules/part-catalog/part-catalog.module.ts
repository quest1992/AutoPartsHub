import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PartCatalogController } from './part-catalog.controller';
import { PartCatalogMatchingService } from './part-catalog-matching.service';
import { PartCatalogService } from './part-catalog.service';
import { PartCompatibilitiesController } from './part-compatibilities.controller';

@Module({
  controllers: [PartCatalogController, PartCompatibilitiesController],
  providers: [PartCatalogService, PartCatalogMatchingService, RolesGuard],
  exports: [PartCatalogService, PartCatalogMatchingService],
})
export class PartCatalogModule {}

