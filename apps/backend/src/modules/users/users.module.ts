import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, RolesGuard],
  exports: [UsersService],
})
export class UsersModule {}
