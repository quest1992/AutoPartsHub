import { Module } from '@nestjs/common';
import { CustomerOrdersAdminController } from './customer-orders-admin.controller';
import { CustomerOrdersController } from './customer-orders.controller';
import { CustomerOrdersService } from './customer-orders.service';
import { OrderReservationExpirationService } from './order-reservation-expiration.service';
import { OrderPricingService } from './order-pricing.service';
import { FinanceSettingsController } from './finance-settings.controller';
@Module({
  controllers: [
    CustomerOrdersController,
    CustomerOrdersAdminController,
    FinanceSettingsController,
  ],
  providers: [
    CustomerOrdersService,
    OrderReservationExpirationService,
    OrderPricingService,
  ],
  exports: [CustomerOrdersService, OrderPricingService],
})
export class CustomerOrdersModule {}
