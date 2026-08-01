import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VehicleFitmentController } from './vehicle-fitment.controller';
import { VehicleFitmentService } from './vehicle-fitment.service';

@Module({
  controllers: [VehicleFitmentController],
  providers: [VehicleFitmentService, RolesGuard],
  exports: [VehicleFitmentService],
})
export class VehicleFitmentModule {}
