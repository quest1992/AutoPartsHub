import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class DecodeVinDto {
  @ApiProperty({ example: '4T1G11AK0MU001001' })
  @IsString()
  @Length(17, 17)
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/i, {
    message: 'VIN должен состоять из 17 символов и не содержать I, O или Q',
  })
  vin!: string;
}
