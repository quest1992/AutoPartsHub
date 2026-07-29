import { Injectable, NotFoundException } from '@nestjs/common';
import { VinDecodedVehicle, VinProviderHealth } from '../vin.types';
import { VinProvider } from './vin-provider.interface';

type MockVehicle = Omit<
  VinDecodedVehicle,
  'vin' | 'wmi' | 'provider' | 'decodedAt' | 'rawData'
>;

const makes: Array<
  [string, string, string, string, string, string, string, string, number]
> = [
  [
    'Toyota',
    'Camry',
    'XV70',
    'A25A-FKS',
    'PETROL',
    'Sedan',
    'Automatic',
    'Japan',
    2021,
  ],
  ['Honda', 'Civic', 'X', 'L15B7', 'PETROL', 'Sedan', 'CVT', 'Japan', 2020],
  [
    'Hyundai',
    'Elantra',
    'CN7',
    'G4NL',
    'PETROL',
    'Sedan',
    'Automatic',
    'South Korea',
    2022,
  ],
  [
    'Kia',
    'Sportage',
    'NQ5',
    'G4KN',
    'PETROL',
    'SUV',
    'Automatic',
    'South Korea',
    2023,
  ],
  [
    'BMW',
    '3 Series',
    'G20',
    'B48B20',
    'PETROL',
    'Sedan',
    'Automatic',
    'Germany',
    2021,
  ],
  [
    'Mercedes',
    'C-Class',
    'W206',
    'M254',
    'PETROL',
    'Sedan',
    'Automatic',
    'Germany',
    2022,
  ],
  ['Audi', 'A4', 'B9', 'DKNA', 'PETROL', 'Sedan', 'S tronic', 'Germany', 2021],
  [
    'Volkswagen',
    'Tiguan',
    'AD1',
    'CZPA',
    'PETROL',
    'SUV',
    'DSG',
    'Germany',
    2020,
  ],
  ['Nissan', 'X-Trail', 'T32', 'QR25DE', 'PETROL', 'SUV', 'CVT', 'Japan', 2019],
  [
    'Lexus',
    'RX',
    'AL20',
    '2GR-FKS',
    'PETROL',
    'SUV',
    'Automatic',
    'Japan',
    2021,
  ],
];

const vins = [
  '4T1G11AK0MU001001',
  '4T1G11AK0MU001002',
  '4T1G11AK0MU001003',
  '2HGFC1F30LH001001',
  '2HGFC1F30LH001002',
  '2HGFC1F30LH001003',
  'KMHLM41DBNU001001',
  'KMHLM41DBNU001002',
  'KMHLM41DBNU001003',
  'KNAPU81BPN7001001',
  'KNAPU81BPN7001002',
  'KNAPU81BPN7001003',
  'WBA5R1C00MF001001',
  'WBA5R1C00MF001002',
  'WBA5R1C00MF001003',
  'W1KAF4GB0NR001001',
  'W1KAF4GB0NR001002',
  'W1KAF4GB0NR001003',
  'WAUZZZF40MA001001',
  'WAUZZZF40MA001002',
  'WAUZZZF40MA001003',
  'WVGZZZ5NZLW001001',
  'WVGZZZ5NZLW001002',
  'WVGZZZ5NZLW001003',
  'JN1TBNT32U0010001',
  'JN1TBNT32U0010002',
  'JN1TBNT32U0010003',
  'JTJBZMCA0M2010001',
  'JTJBZMCA0M2010002',
  'JTJBZMCA0M2010003',
];

const records = new Map<string, MockVehicle>(
  vins.map((vin, index) => {
    const [
      manufacturer,
      model,
      generation,
      engineCode,
      fuel,
      body,
      transmission,
      country,
      year,
    ] = makes[Math.floor(index / 3)];
    return [
      vin,
      {
        manufacturer,
        model,
        generation,
        engineCode,
        year,
        fuel,
        body,
        transmission,
        country,
        confidence: 0.95,
      },
    ];
  }),
);

@Injectable()
export class MockVinProvider implements VinProvider {
  async decode(vin: string): Promise<VinDecodedVehicle> {
    const normalizedVin = vin.trim().toUpperCase();
    const record = records.get(normalizedVin);
    if (!record) {
      throw new NotFoundException('VIN отсутствует в mock-провайдере');
    }
    return this.normalize({
      vin: normalizedVin,
      wmi: normalizedVin.slice(0, 3),
      ...record,
      provider: 'MOCK',
      decodedAt: new Date(),
      rawData: { source: 'embedded-fixture', fixtureVersion: 1 },
    });
  }

  async health(): Promise<VinProviderHealth> {
    return { available: true, provider: 'MOCK' };
  }

  normalize(data: VinDecodedVehicle): VinDecodedVehicle {
    return {
      ...data,
      vin: data.vin.trim().toUpperCase(),
      wmi: data.vin.trim().toUpperCase().slice(0, 3),
      manufacturer: data.manufacturer?.trim() ?? null,
      model: data.model?.trim() ?? null,
      generation: data.generation?.trim() ?? null,
      engineCode: data.engineCode?.trim().toUpperCase() ?? null,
    };
  }
}
