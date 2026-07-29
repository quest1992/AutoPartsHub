import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class VehicleRegistryQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit = 25;
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isActive?: boolean;
  @IsOptional() @IsString() sort = 'name';
  @IsOptional() @IsString() order: 'asc' | 'desc' = 'asc';
}

export class CreateVehicleRegistryItemDto {
  @IsString() @Length(1, 100) name!: string;
  @IsString() @Length(1, 120) slug!: string;
  @IsOptional() @IsString() @Length(1, 500) description?: string;
}

export class UpdateVehicleRegistryItemDto extends PartialType(
  CreateVehicleRegistryItemDto,
) {}

export class VehicleModificationQueryDto extends VehicleRegistryQueryDto {
  @IsOptional() @IsUUID() generationId?: string;
  @IsOptional() @IsUUID() modelId?: string;
  @IsOptional() @IsUUID() engineId?: string;
  @IsOptional() @IsUUID() manufacturerId?: string;
  @IsOptional() @IsUUID() bodyTypeId?: string;
  @IsOptional() @IsUUID() marketRegionId?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1886)
  @Max(2200)
  year?: number;
}

export class CreateVehicleModificationDto {
  @IsUUID() generationId!: string;
  @IsUUID() bodyTypeId!: string;
  @IsUUID() engineId!: string;
  @IsUUID() transmissionTypeId!: string;
  @IsUUID() driveTypeId!: string;
  @IsUUID() fuelTypeId!: string;
  @IsUUID() steeringPositionId!: string;
  @IsUUID() marketRegionId!: string;
  @IsOptional() @IsInt() @Min(1886) @Max(2200) productionFrom?: number;
  @IsOptional() @IsInt() @Min(1886) @Max(2200) productionTo?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10) doors?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5000) powerKW?: number;
  @IsOptional() @IsInt() @Min(1) @Max(7000) powerHP?: number;
  @IsOptional() @IsString() @Length(1, 50) vinFrom?: string;
  @IsOptional() @IsString() @Length(1, 50) vinTo?: string;
  @IsOptional() @IsString() @Length(1, 1000) remarks?: string;
}

export class UpdateVehicleModificationDto extends PartialType(
  CreateVehicleModificationDto,
) {}
