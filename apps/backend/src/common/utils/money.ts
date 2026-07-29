import { Prisma } from '@prisma/client';
export type MoneyInput = Prisma.Decimal | string | number;
export const money = (value: MoneyInput) => new Prisma.Decimal(value);
export const roundMoney = (value: MoneyInput) =>
  money(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
export const addMoney = (...values: MoneyInput[]) =>
  roundMoney(
    values.reduce<Prisma.Decimal>(
      (sum, value) => sum.plus(money(value)),
      money(0),
    ),
  );
export const subtractMoney = (left: MoneyInput, right: MoneyInput) =>
  roundMoney(money(left).minus(money(right)));
export const multiplyMoney = (left: MoneyInput, right: MoneyInput) =>
  roundMoney(money(left).mul(money(right)));
