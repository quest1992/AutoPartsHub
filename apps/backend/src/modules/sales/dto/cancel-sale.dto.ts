import { IsString, MinLength } from 'class-validator';
export class CancelSaleDto {
  @IsString() @MinLength(1) reason!: string;
}
