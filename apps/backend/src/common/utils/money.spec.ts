import {
  addMoney,
  money,
  multiplyMoney,
  roundMoney,
  subtractMoney,
} from './money';
describe('money', () => {
  it('avoids 0.1 + 0.2 floating point error', () =>
    expect(addMoney('0.1', '0.2').toString()).toBe('0.3'));
  it('rounds half up to two decimals', () =>
    expect(roundMoney('10.125').toString()).toBe('10.13'));
  it('multiplies money and quantity', () =>
    expect(multiplyMoney('19.99', 3).toString()).toBe('59.97'));
  it('subtracts precisely', () =>
    expect(subtractMoney('1500', '1000').toString()).toBe('500'));
  it('creates Decimal values', () =>
    expect(money(5).plus(2).toString()).toBe('7'));
});
