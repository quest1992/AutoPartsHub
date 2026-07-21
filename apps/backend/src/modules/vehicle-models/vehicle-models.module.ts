import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';
import { VehicleModelsController } from './vehicle-models.controller';
import { VehicleModelsService } from './vehicle-models.service';

@Module({
  controllers: [VehicleModelsController],
  providers: [VehicleModelsService, RolesGuard],
  exports: [VehicleModelsService],
})
export class VehicleModelsModule {}
