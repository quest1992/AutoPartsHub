import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreatePartAliasDto {
  @ApiProperty({ example: 'Колодки передние тормозные' })
  @IsString()
  @Length(1, 500)
  alias!: string;

  @ApiPropertyOptional({ example: 'Каталог поставщика' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  source?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}
