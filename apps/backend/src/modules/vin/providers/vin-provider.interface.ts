import { VinDecodedVehicle, VinProviderHealth } from '../vin.types';

export interface VinProvider {
  decode(vin: string): Promise<VinDecodedVehicle>;
  health(): Promise<VinProviderHealth>;
  normalize(data: VinDecodedVehicle): VinDecodedVehicle;
}
