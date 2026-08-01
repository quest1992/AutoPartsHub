import { BadRequestException } from '@nestjs/common';
import { parseVehicleImport, VehicleImportService } from './vehicle-import.service';

describe('VehicleImportService', () => {
  it('parses CSV with BOM', () => {
    const rows = parseVehicleImport(
      Buffer.from('\uFEFFmanufacturer,model\nToyota,Corolla'),
      'vehicles.csv',
    );
    expect(rows).toEqual([{ manufacturer: 'Toyota', model: 'Corolla' }]);
  });

  it('parses JSON records', () => {
    const rows = parseVehicleImport(
      Buffer.from(
        JSON.stringify({
          records: [{ manufacturer: 'Tesla', model: 'Model 3' }],
        }),
      ),
      'vehicles.json',
    );
    expect(rows[0]).toMatchObject({ manufacturer: 'Tesla', model: 'Model 3' });
  });

  it('rejects unsupported file formats', () => {
    expect(() =>
      parseVehicleImport(Buffer.from('test'), 'vehicles.xlsx'),
    ).toThrow(BadRequestException);
  });

  it('reports dry-run counts and does not write', async () => {
    const prisma: any = {
      manufacturer: { findMany: jest.fn().mockResolvedValue([]) },
      vehicleModel: { findMany: jest.fn().mockResolvedValue([]) },
      vehicleGeneration: { findMany: jest.fn().mockResolvedValue([]) },
      vehicleSpecification: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(),
    };
    const service = new VehicleImportService(prisma);
    const report = await service.import(
      {
        originalname: 'vehicles.json',
        buffer: Buffer.from(
          JSON.stringify([{ manufacturer: 'BMW', model: 'i3' }]),
        ),
      },
      true,
    );
    expect(report).toMatchObject({
      mode: 'dry-run',
      newRecords: 2,
      errors: [],
      progress: 'planned',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects specifications without source and license', async () => {
    const prisma: any = {
      manufacturer: { findMany: jest.fn().mockResolvedValue([]) },
      vehicleModel: { findMany: jest.fn().mockResolvedValue([]) },
      vehicleGeneration: { findMany: jest.fn().mockResolvedValue([]) },
      vehicleSpecification: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new VehicleImportService(prisma);
    const report = await service.import(
      {
        originalname: 'vehicles.json',
        buffer: Buffer.from(
          JSON.stringify([
            {
              manufacturer: 'BYD',
              model: 'E2',
              specificationYear: 2021,
            },
          ]),
        ),
      },
      true,
    );
    expect(report.errors).toHaveLength(1);
    expect(report.progress).toBe('validation-failed');
  });
});
