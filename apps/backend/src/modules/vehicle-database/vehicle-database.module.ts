import { Module } from '@nestjs/common';
import { VehicleDatabaseController } from './vehicle-database.controller';
import { VehicleDatabaseService } from './vehicle-database.service';

@Module({
  controllers: [VehicleDatabaseController],
  providers: [VehicleDatabaseService],
  exports: [VehicleDatabaseService],
})
export class VehicleDatabaseModule {}
