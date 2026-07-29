import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MergePartCatalogSuggestionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  partCatalogItemId!: string;
}
