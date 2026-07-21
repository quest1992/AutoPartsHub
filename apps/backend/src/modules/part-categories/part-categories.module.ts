import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PartCategoriesController } from './part-categories.controller';
import { PartCategoriesService } from './part-categories.service';

@Module({
  controllers: [PartCategoriesController],
  providers: [PartCategoriesService, RolesGuard],
  exports: [PartCategoriesService],
})
export class PartCategoriesModule {}
