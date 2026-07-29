import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OemDatabaseController } from './oem-database.controller';
import { OemDatabaseService } from './oem-database.service';

@Module({
  controllers: [OemDatabaseController],
  providers: [OemDatabaseService, RolesGuard],
  exports: [OemDatabaseService],
})
export class OemDatabaseModule {}
