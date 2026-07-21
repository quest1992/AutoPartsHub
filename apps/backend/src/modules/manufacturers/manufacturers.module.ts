import { Module } from '@nestjs/common';

import { ManufacturersController } from './manufacturers.controller';
import { ManufacturersService } from './manufacturers.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [ManufacturersController],
  providers: [ManufacturersService, RolesGuard],
  exports: [ManufacturersService],
})
export class ManufacturersModule {}
