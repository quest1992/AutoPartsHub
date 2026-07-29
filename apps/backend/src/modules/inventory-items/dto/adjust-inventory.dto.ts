import { IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator';
export class AdjustInventoryDto {
  @IsEnum(['INCREASE', 'DECREASE', 'SET']) type!:
    'INCREASE' | 'DECREASE' | 'SET';
  @IsInt() @Min(0) quantity!: number;
  @IsString() @MinLength(3) reason!: string;
}
