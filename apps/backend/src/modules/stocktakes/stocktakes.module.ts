import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StocktakesController } from './stocktakes.controller';
import { StocktakesService } from './stocktakes.service';
@Module({
  controllers: [StocktakesController],
  providers: [StocktakesService, RolesGuard],
})
export class StocktakesModule {}
