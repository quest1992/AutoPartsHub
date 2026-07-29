import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { VehicleFitmentsService } from './vehicle-fitments.service';

describe('VehicleFitmentsService (integration)', () => {
  it('loads a complete brand → model → generation → engine tree', async () => {
    const tree = [
      {
        id: 'brand',
        name: 'Toyota',
        vehicleModels: [
          {
            id: 'model',
            name: 'Camry',
            generations: [
              {
                id: 'generation',
                name: 'XV70',
                engines: [{ id: 'engine', code: 'A25A' }],
              },
            ],
          },
        ],
      },
    ];
    const prisma = {
      manufacturer: { findMany: jest.fn().mockResolvedValue(tree) },
    };
    const module = await Test.createTestingModule({
      providers: [
        VehicleFitmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const result = await module.get(VehicleFitmentsService).findTree();
    expect(result[0].vehicleModels[0].generations[0].engines[0].code).toBe(
      'A25A',
    );
    expect(prisma.manufacturer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});
