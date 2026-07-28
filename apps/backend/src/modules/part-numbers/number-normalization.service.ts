import { Injectable } from '@nestjs/common';
import { normalizePartNumber } from '../../common/utils/part-number-normalizer';

@Injectable()
export class NumberNormalizationService {
  normalize(number: string): string {
    return normalizePartNumber(number);
  }
}
