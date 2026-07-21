import { IsString, Length } from 'class-validator';
export class ResetEmployeePasswordDto { @IsString() @Length(8, 100) temporaryPassword!: string; }
