import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';
import { VehicleGenerationsController } from './vehicle-generations.controller';
import { VehicleGenerationsService } from './vehicle-generations.service';

@Module({
  controllers: [VehicleGenerationsController],
  providers: [VehicleGenerationsService, RolesGuard],
  exports: [VehicleGenerationsService],
})
export class VehicleGenerationsModule {}
