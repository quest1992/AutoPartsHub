import { Module } from '@nestjs/common';
import { ShopSettlementsController } from './shop-settlements.controller';
import { ShopSettlementsService } from './shop-settlements.service';
@Module({
  controllers: [ShopSettlementsController],
  providers: [ShopSettlementsService],
  exports: [ShopSettlementsService],
})
export class ShopSettlementsModule {}
