import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
@Module({
  controllers: [SalesController],
  providers: [SalesService, RolesGuard],
})
export class SalesModule {}
