import { PartialType } from '@nestjs/swagger';

import { CreateVehicleGenerationDto } from './create-vehicle-generation.dto';

export class UpdateVehicleGenerationDto extends PartialType(
  CreateVehicleGenerationDto,
) {}
