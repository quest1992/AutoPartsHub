import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VinCacheQueryDto } from './dto/vin-cache-query.dto';
import type { VinProvider } from './providers/vin-provider.interface';
import {
  VIN_PROVIDER,
  VinDecodedVehicle,
  VinMatchStatus,
} from './vin.types';

@Injectable()
export class VinService {
  private readonly logger = new Logger(VinService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(VIN_PROVIDER) private readonly provider: VinProvider,
  ) {}

  async decode(vinInput: string) {
    const startedAt = Date.now();
    const vin = vinInput.trim().toUpperCase();
    const cached = await this.prisma.vinDecodeCache.findUnique({ where: { vin } });
    const cacheHit = Boolean(cached);

    const decoded: VinDecodedVehicle = cached
      ? {
          vin: cached.vin,
          wmi: cached.wmi,
          manufacturer: cached.manufacturer,
          model: cached.model,
          generation: cached.generation,
          engineCode: cached.engineCode,
          year: cached.year,
          fuel: cached.fuel,
          body: cached.body,
          transmission: cached.transmission,
          country: cached.country,
          confidence: cached.confidence,
          provider: cached.provider,
          decodedAt: cached.decodedAt,
          rawData: cached.rawData as Record<string, unknown>,
        }
      : await this.provider.decode(vin);

    if (!cached) {
      await this.prisma.vinDecodeCache.create({
        data: {
          vin: decoded.vin,
          wmi: decoded.wmi,
          manufacturer: decoded.manufacturer,
          model: decoded.model,
          generation: decoded.generation,
          engineCode: decoded.engineCode,
          year: decoded.year,
          fuel: decoded.fuel,
          body: decoded.body,
          transmission: decoded.transmission,
          country: decoded.country,
          confidence: decoded.confidence,
          provider: decoded.provider,
          decodedAt: decoded.decodedAt,
          rawData: decoded.rawData as Prisma.InputJsonValue,
        },
      });
    }

    const match = await this.matchVehicle(decoded);
    const catalogItems = match.engineId
      ? await this.findCatalogItems(match.engineId, decoded.year)
      : [];

    this.logger.log(
      `decode vin=${vin} provider=${decoded.provider} cache=${cacheHit ? 'hit' : 'miss'} durationMs=${Date.now() - startedAt}`,
    );

    return {
      vehicle: decoded,
      cacheHit,
      matchStatus: match.matchStatus,
      matchedIds: {
        brandId: match.brandId,
        modelId: match.modelId,
        generationId: match.generationId,
        engineId: match.engineId,
      },
      catalogItems,
    };
  }

  async findCache(query: VinCacheQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.VinDecodeCacheWhereInput = search
      ? {
          OR: [
            { vin: { contains: search, mode: 'insensitive' } },
            { manufacturer: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { engineCode: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.vinDecodeCache.findMany({
        where,
        orderBy: { decodedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.vinDecodeCache.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findCacheOne(id: string) {
    const entry = await this.prisma.vinDecodeCache.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('VIN cache entry не найдена');
    return entry;
  }

  async removeCache(id: string) {
    await this.findCacheOne(id);
    await this.prisma.vinDecodeCache.delete({ where: { id } });
    return { id };
  }

  private async matchVehicle(vehicle: VinDecodedVehicle) {
    const brand = vehicle.manufacturer
      ? await this.prisma.manufacturer.findFirst({
          where: { name: { equals: vehicle.manufacturer, mode: 'insensitive' }, isActive: true },
          select: { id: true },
        })
      : null;
    const model = brand && vehicle.model
      ? await this.prisma.vehicleModel.findFirst({
          where: {
            manufacturerId: brand.id,
            name: { equals: vehicle.model, mode: 'insensitive' },
            isActive: true,
          },
          select: { id: true },
        })
      : null;
    const generation = model && vehicle.generation
      ? await this.prisma.vehicleGeneration.findFirst({
          where: {
            vehicleModelId: model.id,
            name: { equals: vehicle.generation, mode: 'insensitive' },
            isActive: true,
            ...(vehicle.year
              ? {
                  AND: [
                    { OR: [{ startYear: null }, { startYear: { lte: vehicle.year } }] },
                    { OR: [{ endYear: null }, { endYear: { gte: vehicle.year } }] },
                  ],
                }
              : {}),
          },
          select: { id: true },
        })
      : null;
    const engine = generation && vehicle.engineCode
      ? await this.prisma.engine.findFirst({
          where: {
            generationId: generation.id,
            code: { equals: vehicle.engineCode, mode: 'insensitive' },
            isActive: true,
          },
          select: { id: true },
        })
      : null;

    let matchStatus: VinMatchStatus = 'NOT_FOUND';
    if (engine) matchStatus = 'FOUND';
    else if (brand || model || generation) matchStatus = 'PARTIAL';

    return {
      matchStatus,
      brandId: brand?.id ?? null,
      modelId: model?.id ?? null,
      generationId: generation?.id ?? null,
      engineId: engine?.id ?? null,
    };
  }

  private async findCatalogItems(engineId: string, year: number | null) {
    const fitments = await this.prisma.vehicleFitment.findMany({
      where: {
        engineId,
        ...(year
          ? {
              AND: [
                { OR: [{ yearFrom: null }, { yearFrom: { lte: year } }] },
                { OR: [{ yearTo: null }, { yearTo: { gte: year } }] },
              ],
            }
          : {}),
        catalogItem: { isActive: true },
      },
      select: {
        catalogItem: {
          select: {
            id: true,
            internalCode: true,
            name: true,
            slug: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
    return fitments.map((fitment) => fitment.catalogItem);
  }
}
