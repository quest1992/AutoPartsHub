import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NumberNormalizationService } from './number-normalization.service';
import { PartNumberManufacturersController } from './part-number-manufacturers.controller';
import { PartNumbersController } from './part-numbers.controller';
import { PartNumbersService } from './part-numbers.service';

@Module({
  controllers: [PartNumbersController, PartNumberManufacturersController],
  providers: [PartNumbersService, NumberNormalizationService, RolesGuard],
  exports: [PartNumbersService, NumberNormalizationService],
})
export class PartNumbersModule {}
