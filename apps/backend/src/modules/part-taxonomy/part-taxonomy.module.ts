import { Module } from '@nestjs/common';
import { PartTaxonomyApplyService } from './part-taxonomy-apply.service';
import { PartTaxonomyController } from './part-taxonomy.controller';
import { PartTaxonomyService } from './part-taxonomy.service';

@Module({
  controllers: [PartTaxonomyController],
  providers: [PartTaxonomyService, PartTaxonomyApplyService],
  exports: [PartTaxonomyService],
})
export class PartTaxonomyModule {}
