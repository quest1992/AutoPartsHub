import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VehicleImportController } from './vehicle-import.controller';
import { VehicleImportService } from './vehicle-import.service';

@Module({
  controllers: [VehicleImportController],
  providers: [VehicleImportService, RolesGuard],
})
export class VehicleImportModule {}
