import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { VehicleFitmentsService } from './vehicle-fitments.service';

describe('VehicleFitmentsService (unit)', () => {
  let service: VehicleFitmentsService;
  const prisma = {
    manufacturer: { findMany: jest.fn() },
    vehicleFitment: { findUnique: jest.fn(), delete: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        VehicleFitmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(VehicleFitmentsService);
  });

  it('returns only active brands in alphabetical order', async () => {
    prisma.manufacturer.findMany.mockResolvedValue([{ id: '1', name: 'Audi' }]);
    await expect(service.findBrands()).resolves.toEqual([{ id: '1', name: 'Audi' }]);
    expect(prisma.manufacturer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    );
  });

  it('rejects an inverted year range before accessing the database', async () => {
    await expect(
      service.create({
        catalogItemId: '7c097447-009a-45e6-a919-636783fca59f',
        engineId: '58569186-ec20-4de0-8b25-1700ac79a556',
        yearFrom: 2024,
        yearTo: 2020,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
