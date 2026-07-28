import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MockVinProvider } from './providers/mock-vin-provider';
import { VinController } from './vin.controller';
import { VinService } from './vin.service';
import { VIN_PROVIDER } from './vin.types';

@Module({
  controllers: [VinController],
  providers: [
    VinService,
    RolesGuard,
    MockVinProvider,
    { provide: VIN_PROVIDER, useExisting: MockVinProvider },
  ],
  exports: [VinService, VIN_PROVIDER],
})
export class VinModule {}
