import { PartialType } from '@nestjs/swagger';
import { CreatePartNumberDto } from './create-part-number.dto';

export class UpdatePartNumberDto extends PartialType(CreatePartNumberDto) {}
