import { PartialType } from '@nestjs/swagger';
import { CreatePartCatalogItemDto } from './create-part-catalog-item.dto';

export class UpdatePartCatalogItemDto extends PartialType(
  CreatePartCatalogItemDto,
) {}
