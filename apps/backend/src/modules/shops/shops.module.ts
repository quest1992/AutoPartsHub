import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';

@Module({
  providers: [ShopsService, RolesGuard],
  controllers: [ShopsController],
})
export class ShopsModule {}
