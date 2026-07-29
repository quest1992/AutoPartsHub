import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PartCatalogModule } from '../part-catalog/part-catalog.module';
import { CatalogBootstrapController } from './catalog-bootstrap.controller';
import { CatalogBootstrapService } from './catalog-bootstrap.service';

@Module({
  imports: [PartCatalogModule],
  controllers: [CatalogBootstrapController],
  providers: [CatalogBootstrapService, RolesGuard],
})
export class CatalogBootstrapModule {}
