import {
  hasDirectedCycle,
  normalizeOemNumber,
  parseOemCsv,
  validateRows,
} from '../prisma/oem-database.seed';

const header =
  'manufacturer,oem_number,description,brand,category,model,generation,year_from,year_to,external_part_number,source_url';

describe('OEM database import', () => {
  it.each(['43512-0D080', '435120D080', '43512 0d080', '43512/0D080'])(
    'normalizes %s to one exact value',
    (value) => expect(normalizeOemNumber(value)).toBe('435120D080'),
  );

  it.each([',', ';', '\t'])(
    'parses UTF-8 CSV with %s delimiter',
    (separator) => {
      const csv = `${header.replace(/,/g, separator)}\n${[
        'Toyota',
        '43512-0D080',
        'Disc',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'https://example.test/source',
      ].join(separator)}`;
      expect(parseOemCsv(`\uFEFF${csv}`)[0].oem_number).toBe('43512-0D080');
    },
  );

  it('deduplicates within one manufacturer but not across manufacturers', () => {
    const row = (manufacturer: string, number: string) =>
      `${manufacturer},${number},,,,,,,,,https://example.test/source`;
    expect(
      validateRows(
        parseOemCsv(
          `${header}\n${row('Toyota', 'A-1')}\n${row('Toyota', 'A1')}`,
        ),
      ),
    ).toHaveLength(1);
    expect(
      validateRows(
        parseOemCsv(
          `${header}\n${row('Toyota', 'A-1')}\n${row('Honda', 'A1')}`,
        ),
      ),
    ).toHaveLength(0);
  });

  it('detects directed replacement cycles', () => {
    expect(
      hasDirectedCycle([
        ['a', 'b'],
        ['b', 'c'],
      ]),
    ).toBe(false);
    expect(
      hasDirectedCycle([
        ['a', 'b'],
        ['b', 'a'],
      ]),
    ).toBe(true);
  });
});
