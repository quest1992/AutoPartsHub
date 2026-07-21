import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
export class CancelPurchaseDto {
  @ApiProperty({ example: 'Ошибочный приход' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
