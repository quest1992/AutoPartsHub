import { CatalogItem, Pagination, request } from "./api";

export type OemOption = {
  id: string;
  name: string;
  slug?: string;
  url?: string;
  license?: string;
  sourceType?: string;
};
export type OemFitment = {
  id: string;
  manufacturerId: string;
  vehicleModelId: string | null;
  vehicleGenerationId: string | null;
  vehicleSpecificationId: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  position: string;
  side: string;
  notes: string | null;
  confidence: number;
  manufacturer: OemOption;
  vehicleModel: { id: string; name: string } | null;
  vehicleGeneration: { id: string; name: string } | null;
  vehicleSpecification: {
    id: string;
    year: number;
    trim: string | null;
    variant: string | null;
  } | null;
  source: OemOption;
};
export type OemCrossReference = {
  id: string;
  relationType: string;
  confidence: number;
  externalPartNumber: string | null;
  notes: string | null;
  toOemPart: { id: string; displayNumber: string } | null;
  partBrand: { id: string; officialName: string } | null;
  source: OemOption;
};
export type OemPart = {
  id: string;
  number: string;
  normalizedNumber: string;
  displayNumber: string;
  description: string | null;
  status: "ACTIVE" | "DISCONTINUED" | "SUPERSEDED" | "UNKNOWN";
  isActive: boolean;
  sourceKey: string;
  manufacturerId: string;
  sourceId: string;
  manufacturer: OemOption;
  source: OemOption;
  aliases: Array<{
    id: string;
    alias: string;
    aliasType: string;
    source: OemOption;
  }>;
  categories: Array<{
    id: string;
    isPrimary: boolean;
    confidence: number;
    catalogItem: CatalogItem & { category: { id: string; name: string } };
    source: OemOption;
  }>;
  fitments: OemFitment[];
  outgoingCrossReferences: OemCrossReference[];
};
export type OemOptions = {
  manufacturers: OemOption[];
  sources: OemOption[];
  partBrands: Array<{ id: string; officialName: string }>;
};
const queryString = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.toString();
};
export const listOem = (
  params: {
    search?: string;
    manufacturerId?: string;
    vehicleModelId?: string;
    catalogItemId?: string;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<{ data: OemPart[]; meta: Pagination }>(
    `/oem?${queryString({ page: 1, limit: 50, ...params })}`,
  );
export const getOem = (id: string) => request<OemPart>(`/oem/${id}`);
export const getOemOptions = () => request<OemOptions>("/oem/options");
export const createOem = (data: Record<string, unknown>) =>
  request<OemPart>("/oem", { method: "POST", body: JSON.stringify(data) });
export const updateOem = (id: string, data: Record<string, unknown>) =>
  request<OemPart>(`/oem/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const addOemAlias = (id: string, data: Record<string, unknown>) =>
  request(`/oem/${id}/aliases`, { method: "POST", body: JSON.stringify(data) });
export const addOemCategory = (id: string, data: Record<string, unknown>) =>
  request(`/oem/${id}/categories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const addOemFitment = (id: string, data: Record<string, unknown>) =>
  request(`/oem/${id}/fitments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const addOemCrossReference = (
  id: string,
  data: Record<string, unknown>,
) =>
  request(`/oem/${id}/cross-references`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const deactivateOem = (id: string) =>
  request(`/oem/${id}/deactivate`, { method: "POST" });
export const deactivateOemFitment = (id: string, fitmentId: string) =>
  request(`/oem/${id}/fitments/${fitmentId}/deactivate`, { method: "POST" });
export const deactivateOemCrossReference = (id: string, referenceId: string) =>
  request(`/oem/${id}/cross-references/${referenceId}/deactivate`, {
    method: "POST",
  });
