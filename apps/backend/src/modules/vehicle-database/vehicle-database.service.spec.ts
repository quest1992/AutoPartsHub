import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictException } from '@nestjs/common';
import { VehicleDatabaseService } from './vehicle-database.service';

describe('VehicleDatabaseService', () => {
  const service = new VehicleDatabaseService({} as never);

  it('rejects unknown registries instead of accessing arbitrary Prisma models', async () => {
    await expect(
      service.listRegistry('unknown', {
        page: 1,
        limit: 25,
        sort: 'name',
        order: 'asc',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an inverted modification production range', () => {
    expect(() =>
      service.createModification(
        {
          generationId: 'generation',
          bodyTypeId: 'body',
          engineId: 'engine',
          transmissionTypeId: 'transmission',
          driveTypeId: 'drive',
          fuelTypeId: 'fuel',
          steeringPositionId: 'steering',
          marketRegionId: 'market',
          productionFrom: 2025,
          productionTo: 2020,
        },
        { id: 'admin' },
      ),
    ).toThrow(BadRequestException);
  });

  it('searches and paginates active registry rows by default', async () => {
    const bodyType = {
      findMany: jest.fn().mockResolvedValue([{ id: 'body' }]),
      count: jest.fn().mockResolvedValue(1),
    };
    const serviceWithDb = new VehicleDatabaseService({ bodyType } as never);

    await expect(
      serviceWithDb.listRegistry('body-types', {
        search: 'sed',
        page: 2,
        limit: 5,
        sort: 'name',
        order: 'asc',
      }),
    ).resolves.toEqual({
      data: [{ id: 'body' }],
      meta: { page: 2, limit: 5, total: 1, totalPages: 1 },
    });
    expect(bodyType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          OR: expect.any(Array),
        }),
        skip: 5,
        take: 5,
      }),
    );
  });

  it('maps a duplicate registry name or slug to ConflictException', async () => {
    const duplicate = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });
    const tx = {
      bodyType: { create: jest.fn().mockRejectedValue(duplicate) },
    };
    const serviceWithDb = new VehicleDatabaseService({
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never);

    await expect(
      serviceWithDb.createRegistry(
        'body-types',
        { name: 'Sedan', slug: 'sedan' },
        { id: 'admin' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('records only changed registry fields with the actor', async () => {
    const before = {
      id: 'body',
      name: 'Sedan',
      slug: 'sedan',
      description: null,
      isActive: true,
    };
    const after = { ...before, description: 'Passenger body' };
    const tx = {
      bodyType: {
        findUnique: jest.fn().mockResolvedValue(before),
        update: jest.fn().mockResolvedValue(after),
      },
      vehicleDataChange: {
        create: jest.fn().mockResolvedValue({ id: 'change' }),
      },
    };
    const serviceWithDb = new VehicleDatabaseService({
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as never);

    await serviceWithDb.updateRegistry(
      'body-types',
      'body',
      { description: 'Passenger body' },
      { id: 'admin' },
    );

    expect(tx.vehicleDataChange.create).toHaveBeenCalledWith({
      data: {
        entityType: 'body-types',
        entityId: 'body',
        action: 'UPDATE',
        changedById: 'admin',
        fields: {
          create: [
            {
              fieldName: 'description',
              oldValue: null,
              newValue: 'Passenger body',
            },
          ],
        },
      },
    });
  });

  it('reads history without mutating vehicle data', async () => {
    const vehicleDataChange = {
      findMany: jest.fn().mockResolvedValue([{ id: 'change' }]),
    };
    const serviceWithDb = new VehicleDatabaseService({
      vehicleDataChange,
    } as never);

    await expect(serviceWithDb.history('body-types', 'body')).resolves.toEqual([
      { id: 'change' },
    ]);
    expect(vehicleDataChange.findMany).toHaveBeenCalledTimes(1);
  });
});
