import { ConflictException, Injectable } from '@nestjs/common';
import {
  OrderCommissionType,
  Prisma,
  ShopCommissionType,
} from '@prisma/client';
import {
  money,
  multiplyMoney,
  roundMoney,
  subtractMoney,
} from '../../common/utils/money';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderPricingService {
  constructor(private readonly prisma: PrismaService) {}
  async setting(
    shopId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const shop = await tx.shopCommissionSetting.findFirst({
      where: { shopId, isActive: true },
    });
    if (shop) return shop;
    const global = await tx.platformOrderSetting.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return global
      ? {
          commissionType: global.defaultCommissionType,
          commissionValue: global.defaultCommissionValue,
        }
      : {
          commissionType: ShopCommissionType.MARKUP,
          commissionValue: money(0),
        };
  }
  calculate(input: {
    shopUnitPrice: Prisma.Decimal;
    quantity: number;
    commissionType: OrderCommissionType;
    commissionValue: Prisma.Decimal;
    manualClientUnitPrice?: Prisma.Decimal;
    allowBelowCost?: boolean;
  }) {
    const shopUnitPrice = roundMoney(input.shopUnitPrice);
    let clientUnitPrice: Prisma.Decimal;
    if (input.commissionType === OrderCommissionType.MANUAL)
      clientUnitPrice = roundMoney(
        input.manualClientUnitPrice ?? shopUnitPrice,
      );
    else if (input.commissionType === OrderCommissionType.PERCENT)
      clientUnitPrice = roundMoney(
        shopUnitPrice.plus(shopUnitPrice.mul(input.commissionValue).div(100)),
      );
    else
      clientUnitPrice = roundMoney(shopUnitPrice.plus(input.commissionValue));
    const shopAmount = multiplyMoney(shopUnitPrice, input.quantity);
    const grossAmount = multiplyMoney(clientUnitPrice, input.quantity);
    const platformRevenue = subtractMoney(grossAmount, shopAmount);
    if (platformRevenue.isNegative() && !input.allowBelowCost)
      throw new ConflictException(
        'Цена клиента не может быть ниже цены магазина',
      );
    return {
      shopUnitPrice,
      clientUnitPrice,
      grossAmount,
      clientAmount: grossAmount,
      shopAmount,
      platformRevenue,
      commissionType: input.commissionType,
      commissionValue: roundMoney(input.commissionValue),
    };
  }
}
