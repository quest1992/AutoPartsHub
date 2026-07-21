import { PartialType } from '@nestjs/swagger';
import { CreatePartCompatibilityDto } from './create-part-compatibility.dto';

export class UpdatePartCompatibilityDto extends PartialType(
  CreatePartCompatibilityDto,
) {}
