import {
  marketSlugify,
  normalizeMarketName,
  routeMarketModel,
} from '../prisma/tajikistan-ev-market.seed';

describe('Tajikistan EV market seed', () => {
  it('normalizes case, spaces and hyphens for duplicate checks', () => {
    expect(normalizeMarketName(' AION V-PLUS ')).toBe(
      normalizeMarketName('aion v plus'),
    );
  });

  it('routes existing subbrands without creating manufacturers', () => {
    expect(routeMarketModel('GAC', 'Aion S Plus', 'gac')).toEqual({
      targetManufacturerSlug: 'aion',
      targetName: 'S Plus',
      alias: 'Aion S Plus',
    });
    expect(routeMarketModel('Dongfeng', 'Nammi 06', 'dongfeng')).toEqual({
      targetManufacturerSlug: 'nammi',
      targetName: '06',
      alias: 'Nammi 06',
    });
    expect(routeMarketModel('Changan', 'Deepal S05', 'changan')).toEqual({
      targetManufacturerSlug: 'deepal',
      targetName: 'S05',
      alias: 'Deepal S05',
    });
  });

  it('maps Fangchengbao export names to canonical models', () => {
    expect(routeMarketModel('BYD', 'Leopard 5', 'byd')).toEqual({
      targetManufacturerSlug: 'fangchengbao',
      targetName: 'Bao 5',
      alias: 'Leopard 5',
    });
  });

  it('creates stable ASCII slugs', () => {
    expect(marketSlugify('Lynk & Co 06')).toBe('lynk-and-co-06');
  });
});
