import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreatePartCategoryDto } from './create-part-category.dto';

export class UpdatePartCategoryDto extends PartialType(
  OmitType(CreatePartCategoryDto, ['parentId'] as const),
) {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'null делает категорию корневой',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
