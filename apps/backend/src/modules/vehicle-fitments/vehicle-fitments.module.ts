import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VehicleFitmentsController } from './vehicle-fitments.controller';
import { VehicleFitmentsService } from './vehicle-fitments.service';

@Module({
  controllers: [VehicleFitmentsController],
  providers: [VehicleFitmentsService, RolesGuard],
  exports: [VehicleFitmentsService],
})
export class VehicleFitmentsModule {}
