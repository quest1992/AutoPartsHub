import { Injectable } from '@nestjs/common';
import { PartCatalogItemQueryDto } from './dto/part-catalog-item-query.dto';
import { PartCatalogService } from './part-catalog.service';

@Injectable()
export class CatalogSearchService {
  constructor(private readonly partCatalogService: PartCatalogService) {}

  search(query: PartCatalogItemQueryDto) {
    return this.partCatalogService.findAll(query);
  }
}
