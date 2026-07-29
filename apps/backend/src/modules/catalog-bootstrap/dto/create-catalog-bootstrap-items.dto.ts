import { ApiProperty } from '@nestjs/swagger';
import { PartPosition, PartSide } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

export class CreateCatalogBootstrapItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ enum: PartSide })
  @IsEnum(PartSide)
  side!: PartSide;

  @ApiProperty({ enum: PartPosition })
  @IsEnum(PartPosition)
  position!: PartPosition;
}

export class CreateCatalogBootstrapItemsDto {
  @ApiProperty({ type: [CreateCatalogBootstrapItemDto], maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateCatalogBootstrapItemDto)
  items!: CreateCatalogBootstrapItemDto[];
}
