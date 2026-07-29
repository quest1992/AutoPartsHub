import { Injectable } from '@nestjs/common';
import { CustomerOrdersService } from './customer-orders.service';

@Injectable()
export class OrderReservationExpirationService {
  constructor(private readonly orders: CustomerOrdersService) {}
  releaseExpired() {
    return this.orders.releaseExpired();
  }
}
