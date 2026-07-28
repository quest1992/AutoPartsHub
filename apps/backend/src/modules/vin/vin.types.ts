export type VinDecodedVehicle = {
  vin: string;
  wmi: string;
  manufacturer: string | null;
  model: string | null;
  generation: string | null;
  engineCode: string | null;
  year: number | null;
  fuel: string | null;
  body: string | null;
  transmission: string | null;
  country: string | null;
  confidence: number;
  provider: string;
  decodedAt: Date;
  rawData: Record<string, unknown>;
};

export type VinProviderHealth = {
  available: boolean;
  provider: string;
};

export type VinMatchStatus = 'FOUND' | 'PARTIAL' | 'NOT_FOUND';

export const VIN_PROVIDER = Symbol('VIN_PROVIDER');
