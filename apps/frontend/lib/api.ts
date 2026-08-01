import { clearSession, getToken } from "./auth";
const baseUrl = process.env.NEXT_PUBLIC_API_URL;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!baseUrl) throw new ApiError(0, "Не задан NEXT_PUBLIC_API_URL");
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Не удалось подключиться к серверу. Проверьте, запущен ли backend",
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event("auth:unauthorized"));
    }
    const message = Array.isArray(body?.message)
      ? body.message.join(". ")
      : body?.message;
    throw new ApiError(
      response.status,
      message ?? "Не удалось выполнить запрос",
    );
  }
  return body as T;
}
export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  user: import("./auth").AuthUser;
};
export const login = (phone: string, password: string) =>
  request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
export type UserRole =
  "SUPER_ADMIN" | "SHOP_ADMIN" | "MANAGER" | "SELLER" | "VIEWER";
export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  role: UserRole;
  shopId: string | null;
  isActive: boolean;
  shop: { id: string; name: string; isActive: boolean } | null;
  permissions: string[];
};
export const getCurrentUser = () => request<{ user: CurrentUser }>("/auth/me");
export type SearchResponse = {
  items: Array<{
    inventoryItemId: string;
    partCatalogItemId: string;
    internalCode: string;
    name: string;
    slug: string;
    oemNumber: string | null;
    category: { id: string; name: string };
    manufacturer: { id: string; name: string } | null;
    shop: { id: string; name: string };
    price: string;
    quantity: number;
    availableQuantity: number;
    isActive: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
export function searchInventory(
  params: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(
    ([key, value]) => value !== undefined && query.set(key, String(value)),
  );
  return request<SearchResponse>(`/inventory-search?${query}`);
}
export type InventoryItem = {
  id: string;
  warehouseId: string | null;
  warehouse: ShopWarehouse | null;
  partCatalogItemId: string;
  brand: string | null;
  sku: string | null;
  oemNumber: string | null;
  compatibility: string | null;
  condition: string;
  price: string;
  currency: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minQuantity: number;
  location: string | null;
  notes: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  shop: { id: string; name: string };
  partCatalogItem: {
    name: string;
    internalCode: string;
    category: { name: string };
    compatibilities: Array<{
      vehicleGeneration: {
        name: string;
        vehicleModel: { name: string; manufacturer: { name: string } };
      };
    }>;
  };
};
export type InventoryList = {
  data: InventoryItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
export function inventoryList(
  params: Record<string, string | number | boolean | undefined>,
) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(
    ([k, v]) => v !== undefined && q.set(k, String(v)),
  );
  return request<InventoryList>(`/inventory-items?${q}`);
}
export const inventoryOne = (id: string) =>
  request<InventoryItem>(`/inventory-items/${id}`);
export type InventoryPayload = {
  partCatalogItemId?: string;
  warehouseId?: string;
  brand?: string;
  sku?: string;
  oemNumber?: string;
  compatibility?: string | null;
  condition?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  minQuantity?: number;
  location?: string | null;
  notes?: string;
  isActive?: boolean;
};
export const createInventory = (data: InventoryPayload) =>
  request<InventoryItem>("/inventory-items", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateInventory = (id: string, data: InventoryPayload) =>
  request<InventoryItem>(`/inventory-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteInventory = (id: string) =>
  request<InventoryItem>(`/inventory-items/${id}`, { method: "DELETE" });
export async function uploadInventoryImage(id: string, image: File) {
  if (!baseUrl) throw new ApiError(0, "Не задан NEXT_PUBLIC_API_URL");
  const form = new FormData();
  form.append("image", image);
  const token = getToken();
  const response = await fetch(`${baseUrl}/inventory-items/${id}/image`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      body?.message ?? "Не удалось загрузить фото",
    );
  return body as InventoryItem;
}
export const deleteInventoryImage = (id: string) =>
  request<InventoryItem>(`/inventory-items/${id}/image`, { method: "DELETE" });
export type CatalogItem = {
  id: string;
  name: string;
  internalCode: string;
  slug: string;
  category: { name: string };
  compatibilities: Array<{
    vehicleGeneration: {
      name: string;
      vehicleModel: { name: string; manufacturer: { name: string } };
    };
  }>;
};
export type CatalogCategoryMatch = {
  categoryId: string;
  name: string;
  path: string;
  catalogItemCount: number;
  isLegacyCatalogItemCategory: boolean;
  mappedCatalogItemId: string | null;
  mappedCatalogItemName: string | null;
};
export type CatalogList = {
  data: CatalogItem[];
  categoryMatches: CatalogCategoryMatch[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
export function catalogSearch(
  search: string,
  params: Record<string, string | number | boolean | undefined> = {},
) {
  return request<CatalogList>(
    `/part-catalog/search?${new URLSearchParams({
      search,
      isActive: "true",
      limit: "10",
      ...Object.fromEntries(
        Object.entries(params)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)]),
      ),
    })}`,
  );
}
export type CatalogBootstrapRow = {
  categoryId: string;
  categoryName: string;
  parentCategory: string | null;
  rootCategory: string;
  path: string;
  suggestedName: string;
  suggestedSide: "NONE" | "LEFT" | "RIGHT";
  suggestedPosition: "NONE" | "FRONT" | "REAR";
  existsInCatalog: boolean;
  existingCatalogItemId: string | null;
  warning: string | null;
};
export type CatalogBootstrapResponse = {
  items: CatalogBootstrapRow[];
  summary: {
    categoriesFound: number;
    alreadyExisted: number;
    newCandidates: number;
    warnings: number;
  };
};
export type CatalogBootstrapCreateResponse = {
  results: Array<{
    categoryId: string;
    status: "CREATED" | "EXISTING" | "SKIPPED";
    catalogItemId: string | null;
    message: string | null;
  }>;
  summary: {
    requested: number;
    created: number;
    alreadyExisted: number;
    skipped: number;
  };
};
export const getCatalogBootstrap = () =>
  request<CatalogBootstrapResponse>("/admin/catalog-bootstrap");
export const createCatalogBootstrapItems = (
  items: Array<{
    categoryId: string;
    name: string;
    side: CatalogBootstrapRow["suggestedSide"];
    position: CatalogBootstrapRow["suggestedPosition"];
  }>,
) =>
  request<CatalogBootstrapCreateResponse>("/admin/catalog-bootstrap/create", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
export type CatalogBootstrapAutoCreateResponse = {
  created: number;
  skippedExisting: number;
  skippedUnsafe: number;
  failed: number;
  categoriesFound: number;
  safeRecognized: number;
  deferred: number;
  log: Array<{
    category: string;
    position: string | null;
    status: "CREATED" | "EXISTING" | "UNSAFE" | "FAILED" | "DEFERRED";
    reason: string;
  }>;
};
export const autoCreateSafeCatalog = () =>
  request<CatalogBootstrapAutoCreateResponse>(
    "/admin/catalog-bootstrap/auto-create-safe",
    { method: "POST" },
  );
export type CatalogSuggestionStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "MERGED";
export type CatalogSuggestion = {
  id: string;
  shopId: string;
  name: string;
  normalizedName: string;
  description: string | null;
  oemNumber: string | null;
  suggestedCategoryId: string | null;
  status: CatalogSuggestionStatus;
  resolvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  shop: { id: string; name: string };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
  };
  suggestedCategory: { id: string; name: string } | null;
  resolvedBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string;
  } | null;
  mergedInto: {
    id: string;
    internalCode: string;
    name: string;
    slug: string;
  } | null;
};
export type CatalogSuggestionList = {
  data: CatalogSuggestion[];
  meta: Pagination;
};
export const createCatalogSuggestion = (data: {
  name: string;
  description?: string;
  oemNumber?: string;
  suggestedCategoryId?: string;
}) =>
  request<CatalogSuggestion>("/part-catalog-suggestions", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const getCatalogSuggestions = (
  params: {
    status?: CatalogSuggestionStatus;
    shopId?: string;
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<CatalogSuggestionList>(
    `/part-catalog-suggestions?${documentQuery(params)}`,
  );
export const getCatalogSuggestion = (id: string) =>
  request<CatalogSuggestion>(`/part-catalog-suggestions/${id}`);
export const getSimilarCatalogItems = (search: string) =>
  catalogSearch(search).then(
    (result) => result.data as unknown as PartCatalogEntry[],
  );
export const approveCatalogSuggestion = (
  id: string,
  data: {
    name?: string;
    categoryId: string;
    description?: string;
    side?: PartCatalogEntry["side"];
    position?: PartCatalogEntry["position"];
    isUniversal?: boolean;
  },
) =>
  request<CatalogSuggestion>(`/part-catalog-suggestions/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const mergeCatalogSuggestion = (id: string, partCatalogItemId: string) =>
  request<CatalogSuggestion>(`/part-catalog-suggestions/${id}/merge`, {
    method: "POST",
    body: JSON.stringify({ partCatalogItemId }),
  });
export const rejectCatalogSuggestion = (id: string, reason: string) =>
  request<CatalogSuggestion>(`/part-catalog-suggestions/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
export type PartCatalogCandidateMatchType =
  "EXACT_NORMALIZED_NAME" | "SAME_TOKENS" | "PARTIAL_TOKENS" | "NAME_CONTAINS";
export type PartCatalogEntry = {
  id: string;
  internalCode: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  category: { id: string; name: string };
  side: "NONE" | "LEFT" | "RIGHT";
  position: "NONE" | "FRONT" | "REAR";
  isUniversal: boolean;
  isActive: boolean;
  normalizedName: string;
  searchTokens: string;
};
export type PartCatalogResponse = {
  data: PartCatalogEntry[];
  meta: Pagination;
};
export type PartCatalogPayload = {
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  side?: PartCatalogEntry["side"];
  position?: PartCatalogEntry["position"];
  isUniversal?: boolean;
  isActive?: boolean;
};
export const getPartCatalog = (
  params: {
    search?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
    categoryId?: string;
    rootCategoryId?: string;
  } = {},
) =>
  request<PartCatalogResponse>(`/part-catalog/search?${documentQuery(params)}`);
export const getPartCatalogItem = (id: string) =>
  request<PartCatalogEntry>(`/part-catalog/${id}`);
export const createPartCatalogItem = (data: PartCatalogPayload) =>
  request<PartCatalogEntry>("/part-catalog", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updatePartCatalogItem = (
  id: string,
  data: Partial<PartCatalogPayload>,
) =>
  request<PartCatalogEntry>(`/part-catalog/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deactivatePartCatalogItem = (id: string) =>
  request<PartCatalogEntry>(`/part-catalog/${id}`, { method: "DELETE" });
export const deletePartCatalogItem = (id: string) =>
  request<PartCatalogEntry>(`/part-catalog/${id}/permanent`, {
    method: "DELETE",
  });
export type PartAlias = {
  id: string;
  alias: string;
  normalizedAlias: string;
  source: string | null;
  isApproved: boolean;
  usageCount: number;
};
export const getPartAliases = (id: string) =>
  request<PartAlias[]>(`/part-catalog/${id}/aliases`);
export const createPartAlias = (id: string, alias: string) =>
  request<PartAlias>(`/part-catalog/${id}/aliases`, {
    method: "POST",
    body: JSON.stringify({ alias, isApproved: true }),
  });
export const deletePartAlias = (partId: string, aliasId: string) =>
  request<PartAlias>(`/part-catalog/${partId}/aliases/${aliasId}`, {
    method: "DELETE",
  });
export type PartNumberType = "OEM" | "AFTERMARKET" | "CROSS" | "INTERNAL";
export type PartNumberManufacturer = {
  id: string;
  name: string;
  isActive: boolean;
};
export type PartNumberEntry = {
  id: string;
  catalogItemId: string;
  manufacturer: PartNumberManufacturer | null;
  number: string;
  normalizedNumber: string;
  type: PartNumberType;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  catalogItem: {
    id: string;
    internalCode: string;
    name: string;
    isActive: boolean;
  };
};
export type PartNumberPayload = {
  catalogItemId: string;
  manufacturerId: string;
  number: string;
  type: PartNumberType;
  isPrimary?: boolean;
};
export const getPartNumberManufacturers = () =>
  request<PartNumberManufacturer[]>("/part-number-manufacturers");
export const getPartNumbers = (
  params: {
    search?: string;
    manufacturerId?: string;
    catalogItemId?: string;
    type?: PartNumberType;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<{ data: PartNumberEntry[]; meta: Pagination }>(
    `/part-numbers?${documentQuery(params)}`,
  );
export const createPartNumber = (data: PartNumberPayload) =>
  request<PartNumberEntry>("/part-numbers", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updatePartNumber = (
  id: string,
  data: Partial<PartNumberPayload>,
) =>
  request<PartNumberEntry>(`/part-numbers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deletePartNumber = (id: string) =>
  request<{ id: string }>(`/part-numbers/${id}`, { method: "DELETE" });
export type PartCategoryOption = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive: boolean;
  parent: { id: string; name: string } | null;
  _count: { children: number };
};
export type PartCategoryTreeNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children: PartCategoryTreeNode[];
};
export type PartCategoryPayload = {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};
export type PartCategoriesQuery = {
  search?: string;
  limit?: number;
  page?: number;
  isActive?: boolean;
  leafOnly?: boolean;
};

export const getPartCategories = (params: PartCategoriesQuery = {}) =>
  request<{ data: PartCategoryOption[]; meta: Pagination }>(
    `/part-categories?${documentQuery({
      search: params.search,
      isActive: params.isActive ?? true,
      leafOnly: params.leafOnly,
      limit: params.limit ?? 20,
      page: params.page ?? 1,
    })}`,
  );
export const getPartCategoryTree = (includeInactive = false) =>
  request<PartCategoryTreeNode[]>(
    `/part-categories/tree?isActive=${includeInactive ? "false" : "true"}`,
  );
export const getPartCategory = (id: string) =>
  request<PartCategoryOption & { children: PartCategoryOption[] }>(
    `/part-categories/${id}`,
  );
export const createPartCategory = (data: PartCategoryPayload) =>
  request<PartCategoryOption>("/part-categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updatePartCategory = (
  id: string,
  data: Partial<PartCategoryPayload>,
) =>
  request<PartCategoryOption>(`/part-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deactivatePartCategory = (id: string) =>
  request<PartCategoryOption>(`/part-categories/${id}`, { method: "DELETE" });
export const deletePartCategory = (id: string) =>
  request<PartCategoryOption>(`/part-categories/${id}/permanent`, {
    method: "DELETE",
  });
export type TaxonomyClassification =
  "CATEGORY" | "CATALOG_ITEM" | "INVALID" | "REVIEW";
export type TaxonomyStatus =
  | "DRAFT"
  | "READY"
  | "APPROVED"
  | "APPLYING"
  | "APPLIED"
  | "FAILED"
  | "CANCELLED";
export type TaxonomyRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaxonomyCategoryRow = {
  id: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  rootCategoryId: string;
  isActive: boolean;
  needsReview: boolean;
  isLeaf: boolean;
  childrenCount: number;
  directItemsCount: number;
  subtreeItemsCount: number;
  mappingCount: number;
  duplicateCount: number;
  suspicious: boolean;
  currentClassification: TaxonomyClassification | null;
  decision: TaxonomyDecision | null;
  requiresDecision: boolean;
  recommendation: {
    recommendation: TaxonomyClassification;
    confidence: number;
    reasons: string[];
    warnings: string[];
    riskLevel: TaxonomyRisk;
  };
};
export type TaxonomyDecision = {
  id: string;
  sourceCategoryId: string;
  classification: TaxonomyClassification;
  targetCategoryId: string | null;
  targetCatalogItemId: string | null;
  canonicalName: string | null;
  aliases: string[] | null;
  duplicateStrategy: string | null;
  status: TaxonomyStatus;
  riskLevel: TaxonomyRisk;
  notes: string | null;
  errorMessage: string | null;
};
export type TaxonomyStats = {
  total: number;
  requiresDecision: number;
  categories: number;
  catalogItems: number;
  invalid: number;
  review: number;
  duplicateGroups: number;
  highRisk: number;
  processed: number;
  statuses: Record<TaxonomyStatus, number>;
};
export type TaxonomyCategoryList = {
  data: TaxonomyCategoryRow[];
  meta: Pagination;
  stats: TaxonomyStats;
};
export type TaxonomyCategoryDetail = PartCategoryOption & {
  slug: string;
  needsReview: boolean;
  children: PartCategoryOption[];
  partCatalogItems: Array<{
    id: string;
    name: string;
    internalCode: string;
    aliases: PartAlias[];
  }>;
  catalogItemMappings: Array<{
    id: string;
    classification: TaxonomyClassification;
    targetCatalogItem: { id: string; name: string } | null;
  }>;
  taxonomySourceDecisions: TaxonomyDecision[];
  duplicates: Array<{ id: string; name: string; slug: string }>;
  recommendation: TaxonomyCategoryRow["recommendation"];
};
export function getTaxonomyCategories(
  params: Record<string, string | number | boolean | undefined> = {},
) {
  return request<TaxonomyCategoryList>(
    `/admin/part-taxonomy/categories?${documentQuery(params)}`,
  );
}
export const getTaxonomyCategory = (id: string) =>
  request<TaxonomyCategoryDetail>(`/admin/part-taxonomy/categories/${id}`);
export const createTaxonomyDecision = (
  data: Partial<TaxonomyDecision> & {
    sourceCategoryId: string;
    classification: TaxonomyClassification;
  },
) =>
  request<TaxonomyDecision>("/admin/part-taxonomy/decisions", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateTaxonomyDecision = (
  id: string,
  data: Partial<TaxonomyDecision>,
) =>
  request<TaxonomyDecision>(`/admin/part-taxonomy/decisions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const taxonomyDecisionAction = (
  id: string,
  action: "validate" | "ready" | "approve" | "cancel" | "preview" | "apply",
) =>
  request<unknown>(`/admin/part-taxonomy/decisions/${id}/${action}`, {
    method: "POST",
  });
export const taxonomyBatchAction = (
  decisionIds: string[],
  action: "preview" | "ready" | "approve" | "apply",
) =>
  request<unknown>(`/admin/part-taxonomy/batches/${action}`, {
    method: "POST",
    body: JSON.stringify({ decisionIds }),
  });
export type Movement = {
  id: string;
  type: string;
  change: number;
  quantityAfter: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};
export const inventoryMovements = (id: string) =>
  request<{ data: Movement[]; meta: { page: number; total: number } }>(
    `/inventory-items/${id}/movements`,
  );
export type CreateSalePayload = {
  shopId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  soldAt?: string;
  discount?: number;
  items: Array<{ inventoryItemId: string; quantity: number }>;
};
export type CreatePurchasePayload = {
  shopId?: string;
  invoiceNumber?: string;
  supplierName?: string;
  supplierPhone?: string;
  notes?: string;
  purchasedAt?: string;
  currency?: string;
  discount?: number;
  items: Array<{
    inventoryItemId?: string;
    catalogItemId?: string;
    quantity: number;
    purchasePrice: number;
    salePrice?: number;
  }>;
};
export const createSale = (data: CreateSalePayload) =>
  request<{ id: string }>("/sales", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const createPurchase = (data: CreatePurchasePayload) =>
  request<{ id: string }>("/purchases", {
    method: "POST",
    body: JSON.stringify(data),
  });
export type ImportPreviewRowStatus = "valid" | "invalid" | "requires_review";
export type InventoryImportPreviewRow = {
  rowNumber: number;
  source: Record<string, string>;
  normalized: {
    partNumber: string | null;
    name: string | null;
    compatibility: string | null;
    storageLocation: string | null;
    price: number | null;
    quantity: number;
  };
  status: ImportPreviewRowStatus;
  errors: string[];
};
export type InventoryImportPreviewResponse = {
  fileName: string;
  worksheetName: string;
  totalRows: number;
  columns: string[];
  suggestedMapping: {
    partNumber: string | null;
    name: string | null;
    compatibility: string | null;
    storageLocation: string | null;
    price: string | null;
    quantity: string | null;
  };
  appliedMapping: {
    partNumberColumn: string | null;
    nameColumn: string;
    compatibilityColumn: string | null;
    storageLocationColumn: string | null;
    priceColumn: string;
    quantityColumn: string;
  };
  mappingErrors: string[];
  previewRows: InventoryImportPreviewRow[];
  summary: {
    validRows: number;
    invalidRows: number;
    requiresReviewRows: number;
  };
};
export type InventoryImportConfirmResponse = {
  jobId: string;
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  requiresReview: number;
  failed: number;
  errors: Array<{ rowNumber: number; message: string }>;
};
export type InventoryImportMapping = {
  partNumberColumn?: string;
  nameColumn: string;
  compatibilityColumn?: string;
  storageLocationColumn?: string;
  priceColumn: string;
  quantityColumn: string;
};
export type Shop = {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type ShopPayload = Partial<
  Omit<Shop, "id" | "isActive" | "createdAt" | "updatedAt">
> & { name: string };
export const getShops = (includeInactive = false) =>
  request<Shop[]>(`/shops${includeInactive ? "?includeInactive=true" : ""}`);
export const shops = () => getShops();
export const getShop = (id: string) => request<Shop>(`/shops/${id}`);
export const createShop = (data: ShopPayload) =>
  request<Shop>("/shops", { method: "POST", body: JSON.stringify(data) });
export const updateShop = (
  id: string,
  data: Partial<ShopPayload> & { isActive?: boolean },
) =>
  request<Shop>(`/shops/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deactivateShop = (id: string) =>
  request<Shop>(`/shops/${id}/deactivate`, { method: "POST" });
export async function importPreview(
  file: File,
  options: { shopId?: string; mapping?: Partial<InventoryImportMapping> } = {},
) {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  if (options.shopId) form.append("shopId", options.shopId);
  if (options.mapping?.partNumberColumn)
    form.append("partNumberColumn", options.mapping.partNumberColumn);
  if (options.mapping?.nameColumn)
    form.append("nameColumn", options.mapping.nameColumn);
  if (options.mapping?.compatibilityColumn)
    form.append("compatibilityColumn", options.mapping.compatibilityColumn);
  if (options.mapping?.storageLocationColumn)
    form.append("storageLocationColumn", options.mapping.storageLocationColumn);
  if (options.mapping?.priceColumn)
    form.append("priceColumn", options.mapping.priceColumn);
  if (options.mapping?.quantityColumn)
    form.append("quantityColumn", options.mapping.quantityColumn);
  const response = await fetch(`${baseUrl}/inventory-import/preview`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(
      response.status,
      body?.message ?? "Ошибка проверки файла",
    );
  }
  return body as InventoryImportPreviewResponse;
}
export async function confirmInventoryImport(
  file: File,
  options: { shopId?: string; mapping: InventoryImportMapping },
) {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  if (options.shopId) form.append("shopId", options.shopId);
  if (options.mapping.partNumberColumn)
    form.append("partNumberColumn", options.mapping.partNumberColumn);
  form.append("nameColumn", options.mapping.nameColumn);
  if (options.mapping.compatibilityColumn)
    form.append("compatibilityColumn", options.mapping.compatibilityColumn);
  if (options.mapping.storageLocationColumn)
    form.append("storageLocationColumn", options.mapping.storageLocationColumn);
  form.append("priceColumn", options.mapping.priceColumn);
  form.append("quantityColumn", options.mapping.quantityColumn);
  const response = await fetch(`${baseUrl}/inventory-import/confirm`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(response.status, body?.message ?? "Ошибка импорта");
  }
  return body as InventoryImportConfirmResponse;
}
export type SmartImportValidationStatus =
  "VALID" | "NEEDS_REVIEW" | "ERROR" | "DUPLICATE";
export type SmartImportMatchStatus =
  "EXACT" | "ALIAS" | "FUZZY" | "MULTIPLE" | "CATEGORY_MATCH" | "NOT_FOUND";
export type SmartInventoryImportRow = {
  rowNumber: number;
  source: {
    name: string;
    article?: string;
    oem?: string;
    quantity: number;
    salePrice: number;
    purchasePrice?: number;
    manufacturer?: string;
    warehouse?: string;
    note?: string;
  };
  normalized: {
    name: string;
    normalizedName: string;
    side: "NONE" | "LEFT" | "RIGHT";
    position: "NONE" | "FRONT" | "REAR";
    warehouseId?: string;
    warehouseName?: string;
  };
  match: {
    status: SmartImportMatchStatus;
    catalogItemId?: string;
    catalogItemName?: string;
    score?: number;
    alternatives?: Array<{
      catalogItemId: string;
      name: string;
      side: string;
      position: string;
      score: number;
    }>;
  };
  validation: {
    status: SmartImportValidationStatus;
    errors: string[];
    warnings: string[];
  };
};
export type SmartInventoryImportPreview = {
  importSessionId: string;
  totalRows: number;
  validRows: number;
  matchedRows: number;
  reviewRows: number;
  errorRows: number;
  duplicateRows: number;
  rows: SmartInventoryImportRow[];
};
export type SmartInventoryImportConfirmRow = {
  rowNumber: number;
  include: boolean;
  catalogItemId?: string;
  quantity: number;
  salePrice: number;
  purchasePrice?: number;
  warehouseId?: string;
  article?: string;
  oem?: string;
  manufacturer?: string;
  note?: string;
  duplicateAction?: "MERGE_QUANTITY" | "KEEP_FIRST" | "KEEP_ALL";
};
export type SmartInventoryImportResult = {
  sessionId: string;
  status: "COMPLETED";
  summary: {
    total: number;
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
    mergedDuplicates: number;
  };
  rows: Array<{
    rowNumber: number;
    status: "CREATED" | "UPDATED" | "SKIPPED" | "FAILED";
    inventoryItemId?: string;
    message: string;
  }>;
};
export async function smartImportPreview(file: File, shopId?: string) {
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  if (shopId) form.append("shopId", shopId);
  const response = await fetch(`${baseUrl}/inventory-import/preview`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      Array.isArray(body?.message)
        ? body.message.join(". ")
        : (body?.message ?? "Ошибка проверки файла"),
    );
  return body as SmartInventoryImportPreview;
}
export const smartConfirmInventoryImport = (
  sessionId: string,
  data: {
    mode: "ADD_QUANTITY" | "REPLACE_QUANTITY";
    rows: SmartInventoryImportConfirmRow[];
  },
) =>
  request<SmartInventoryImportResult>(
    `/inventory-import/${sessionId}/confirm`,
    { method: "POST", body: JSON.stringify(data) },
  );
export async function downloadInventoryImportTemplate() {
  const token = getToken();
  const response = await fetch(`${baseUrl}/inventory-import/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok)
    throw new ApiError(response.status, "Не удалось скачать шаблон");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inventory-import-template.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}
export type SaleStatus = "COMPLETED" | "CANCELLED";
export type PurchaseStatus = "COMPLETED" | "CANCELLED";
export type DocumentShop = { id: string; name: string };
export type DocumentUser = {
  id: string;
  phone?: string;
  email?: string | null;
  role?: UserRole;
  firstName: string;
  lastName: string | null;
};
export type DocumentInventoryItem = {
  id: string;
  sku: string | null;
  oemNumber: string | null;
  price: string;
  quantity: number;
  currency: string;
};
export type DocumentCatalogItem = {
  id: string;
  name: string;
  internalCode: string;
  category: { id: string; name: string };
};
export type SaleItem = {
  id: string;
  itemName: string;
  brand: string | null;
  sku: string | null;
  oemNumber: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  inventoryItem: DocumentInventoryItem;
  partCatalogItem: DocumentCatalogItem;
};
export type PurchaseItem = {
  id: string;
  itemName: string;
  brand: string | null;
  sku: string | null;
  oemNumber: string | null;
  quantity: number;
  purchasePrice: string;
  salePrice: string | null;
  lineTotal: string;
  inventoryItem: DocumentInventoryItem;
  partCatalogItem: DocumentCatalogItem;
};
export type SaleListItem = {
  id: string;
  number: string;
  status: SaleStatus;
  createdAt: string;
  currency: string;
  subtotal: string;
  discount: string;
  totalAmount: string;
  customerName: string | null;
  customerPhone: string | null;
  shop: DocumentShop;
  user: DocumentUser;
  _count: { items: number };
};
export type PurchaseListItem = {
  id: string;
  number: string;
  status: PurchaseStatus;
  purchasedAt: string;
  currency: string;
  subtotal: string;
  discount: string;
  totalAmount: string;
  supplierName: string | null;
  supplierPhone: string | null;
  shop: DocumentShop;
  user: DocumentUser;
  _count: { items: number };
};
export type SaleDetails = SaleListItem & {
  notes: string | null;
  user: DocumentUser;
  items: SaleItem[];
  cancelledAt: string | null;
  cancelledBy: DocumentUser | null;
  cancelReason: string | null;
};
export type PurchaseDetails = PurchaseListItem & {
  invoiceNumber: string | null;
  notes: string | null;
  user: DocumentUser;
  items: PurchaseItem[];
  cancelledAt: string | null;
  cancelledBy: DocumentUser | null;
  cancelReason: string | null;
};
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type SaleListResponse = { data: SaleListItem[]; meta: Pagination };
export type PurchaseListResponse = {
  data: PurchaseListItem[];
  meta: Pagination;
};
export type SalesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: SaleStatus;
  dateFrom?: string;
  dateTo?: string;
  shopId?: string;
};
export type PurchasesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseStatus;
  dateFrom?: string;
  dateTo?: string;
  shopId?: string;
};
function documentQuery(
  params: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(
    ([key, value]) =>
      value !== undefined && value !== "" && query.set(key, String(value)),
  );
  return query.toString();
}
export const getSales = (params: SalesQuery = {}) =>
  request<SaleListResponse>(`/sales?${documentQuery(params)}`);
export const getSaleById = (id: string) => request<SaleDetails>(`/sales/${id}`);
export const cancelSale = (id: string, reason: string) =>
  request<SaleDetails>(`/sales/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
export const getPurchases = (params: PurchasesQuery = {}) =>
  request<PurchaseListResponse>(`/purchases?${documentQuery(params)}`);
export const getPurchaseById = (id: string) =>
  request<PurchaseDetails>(`/purchases/${id}`);
export const cancelPurchase = (id: string, reason: string) =>
  request<PurchaseDetails>(`/purchases/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
export type DashboardPeriod = { dateFrom: string; dateTo: string };
export type DashboardSalesSummary = {
  count: number;
  revenue: string;
  itemsSold: number;
};
export type DashboardPurchasesSummary = {
  count: number;
  total: string;
  itemsPurchased: number;
};
export type DashboardInventorySummary = {
  activeItems: number;
  totalQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
  byWarehouse: Array<{
    warehouseId: string | null;
    name: string;
    quantity: number;
    value: string;
  }>;
};
export type DashboardRecentSale = {
  id: string;
  number: string;
  createdAt: string;
  totalAmount: string;
  currency: string;
  shop: DocumentShop;
};
export type DashboardRecentPurchase = {
  id: string;
  number: string;
  purchasedAt: string;
  supplierName: string | null;
  totalAmount: string;
  currency: string;
  shop: DocumentShop;
};
export type DashboardTopSellingItem = {
  inventoryItemId: string;
  partCatalogItemId: string;
  name: string;
  internalCode: string | null;
  oemNumber: string | null;
  quantity: number;
  total: string;
};
export type DashboardSummary = {
  period: DashboardPeriod;
  sales: DashboardSalesSummary;
  purchases: DashboardPurchasesSummary;
  inventory: DashboardInventorySummary;
  recentSales: DashboardRecentSale[];
  recentPurchases: DashboardRecentPurchase[];
  topSellingItems: DashboardTopSellingItem[];
};
export type DashboardQuery = {
  shopId?: string;
  dateFrom?: string;
  dateTo?: string;
  lowStockThreshold?: number;
};
export const getDashboardSummary = (params: DashboardQuery = {}) =>
  request<DashboardSummary>(`/dashboard/summary?${documentQuery(params)}`);

export type EmployeeRole = Exclude<UserRole, "SUPER_ADMIN">;
export type Employee = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string;
  role: EmployeeRole;
  isActive: boolean;
  shopId: string;
  createdAt: string;
  updatedAt: string;
  shop: { id: string; name: string; isActive: boolean } | null;
};
export type EmployeesList = {
  items: Employee[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type EmployeesQuery = {
  page?: number;
  limit?: number;
  shopId?: string;
  role?: EmployeeRole;
  isActive?: boolean;
  search?: string;
};
export type CreateEmployeePayload = {
  firstName: string;
  lastName?: string;
  phone: string;
  role: EmployeeRole;
  temporaryPassword: string;
  shopId?: string;
};
export type UpdateEmployeePayload = Partial<
  Pick<Employee, "firstName" | "lastName" | "phone" | "role" | "isActive">
>;
export type ResetEmployeePasswordPayload = { temporaryPassword: string };
export const getEmployees = (params: EmployeesQuery = {}) =>
  request<EmployeesList>(`/employees?${documentQuery(params)}`);
export const getEmployee = (id: string, shopId?: string) =>
  request<Employee>(`/employees/${id}${shopId ? `?shopId=${shopId}` : ""}`);
export const createEmployee = (payload: CreateEmployeePayload) =>
  request<Employee>("/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateEmployee = (
  id: string,
  payload: UpdateEmployeePayload,
  shopId?: string,
) =>
  request<Employee>(`/employees/${id}${shopId ? `?shopId=${shopId}` : ""}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const resetEmployeePassword = (
  id: string,
  payload: ResetEmployeePasswordPayload,
  shopId?: string,
) =>
  request<{ success: boolean; message: string }>(
    `/employees/${id}/reset-password${shopId ? `?shopId=${shopId}` : ""}`,
    { method: "POST", body: JSON.stringify(payload) },
  );

export type VehicleEngine = {
  id: string;
  generationId: string;
  code: string;
  name: string;
  volume: string | null;
  fuel: string;
  power: number | null;
  isActive: boolean;
};
export type VehicleTreeGeneration = {
  id: string;
  name: string;
  startYear: number | null;
  endYear: number | null;
  isActive: boolean;
  engines: VehicleEngine[];
};
export type VehicleTreeModel = {
  id: string;
  name: string;
  isActive: boolean;
  generations: VehicleTreeGeneration[];
};
export type VehicleTreeBrand = {
  id: string;
  name: string;
  country: string | null;
  isActive: boolean;
  vehicleModels: VehicleTreeModel[];
};
export type VehicleFitment = {
  id: string;
  catalogItemId: string;
  engineId: string;
  yearFrom: number | null;
  yearTo: number | null;
  notes: string | null;
  engine: VehicleEngine & {
    generation: VehicleTreeGeneration & {
      vehicleModel: VehicleTreeModel & {
        manufacturer: { id: string; name: string };
      };
    };
  };
};
export const getVehicleTree = () =>
  request<VehicleTreeBrand[]>("/vehicles/tree");
export const getVehicleFitments = (
  params: {
    catalogItemId?: string;
    search?: string;
    brandId?: string;
    modelId?: string;
    generationId?: string;
    engineId?: string;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<{ data: VehicleFitment[]; meta: Pagination }>(
    `/vehicle-fitments?${documentQuery(params)}`,
  );
export const searchVehicleFitments = (
  params: {
    search?: string;
    brandId?: string;
    modelId?: string;
    generationId?: string;
    engineId?: string;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<{ data: VehicleFitment[]; meta: Pagination }>(
    `/vehicle-fitments/search?${documentQuery(params)}`,
  );
export const createVehicleFitment = (data: {
  catalogItemId: string;
  engineId: string;
  yearFrom?: number;
  yearTo?: number;
  notes?: string;
}) =>
  request<VehicleFitment>("/vehicle-fitments", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const deleteVehicleFitment = (id: string) =>
  request<{ id: string }>(`/vehicle-fitments/${id}`, { method: "DELETE" });
export type VinMatchStatus = "FOUND" | "PARTIAL" | "NOT_FOUND";
export type VinDecodeResponse = {
  vehicle: {
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
    decodedAt: string;
  };
  cacheHit: boolean;
  matchStatus: VinMatchStatus;
  matchedIds: {
    brandId: string | null;
    modelId: string | null;
    generationId: string | null;
    engineId: string | null;
  };
  catalogItems: Array<{
    id: string;
    internalCode: string;
    name: string;
    slug: string;
    category: { id: string; name: string };
  }>;
};
export const decodeVin = (vin: string) =>
  request<VinDecodeResponse>("/vin/decode", {
    method: "POST",
    body: JSON.stringify({ vin }),
  });
export type MarketplaceOffer = {
  inventoryItemId: string;
  catalogItemId: string;
  name: string;
  internalCode: string;
  imageUrl: string | null;
  oemNumbers: string[];
  crossNumbers: string[];
  shop: {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
  };
  quantity: number;
  price: string;
  currency: string;
  warehouse: string | null;
  manufacturer: { id: string | null; name: string } | null;
  category: { id: string; name: string };
  compatibility: string[];
  condition: string;
};
export type MarketplaceSearchResponse = {
  queryType: "VIN" | "OEM" | "CROSS" | "NAME";
  vehicle: VinDecodeResponse | null;
  items: MarketplaceOffer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
export type MarketplaceSearchParams = {
  q: string;
  inStockOnly?: boolean;
  originalOnly?: boolean;
  analogOnly?: boolean;
  minQuantity?: number;
  manufacturerId?: string;
  categoryId?: string;
  shopId?: string;
  page?: number;
  limit?: number;
};
export const marketplaceSearch = (params: MarketplaceSearchParams) =>
  request<MarketplaceSearchResponse>(
    `/marketplace-search?${documentQuery(params)}`,
  );

export type ShopWarehouse = {
  id: string;
  shopId: string;
  name: string;
  code: string | null;
  address: string | null;
  note: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { inventoryItems: number };
  totalQuantity: number;
};
export const getWarehouses = (shopId?: string) =>
  request<ShopWarehouse[]>(
    `/shop-warehouses${shopId ? `?shopId=${shopId}` : ""}`,
  );
export const createWarehouse = (data: {
  shopId?: string;
  name: string;
  code?: string;
  address?: string;
  note?: string;
  isDefault?: boolean;
}) =>
  request<ShopWarehouse>("/shop-warehouses", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateWarehouse = (
  id: string,
  data: Partial<{
    name: string;
    code: string;
    address: string;
    note: string;
    isDefault: boolean;
  }>,
) =>
  request<ShopWarehouse>(`/shop-warehouses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const setDefaultWarehouse = (id: string) =>
  request<ShopWarehouse>(`/shop-warehouses/${id}/set-default`, {
    method: "POST",
  });
export const deactivateWarehouse = (id: string) =>
  request<ShopWarehouse>(`/shop-warehouses/${id}/deactivate`, {
    method: "POST",
  });
export const activateWarehouse = (id: string) =>
  request<ShopWarehouse>(`/shop-warehouses/${id}/activate`, { method: "POST" });
export const deleteWarehouse = (id: string) =>
  request<ShopWarehouse>(`/shop-warehouses/${id}`, { method: "DELETE" });
export type InventoryTransfer = {
  id: string;
  shopId: string;
  number: string;
  status: "DRAFT" | "COMPLETED" | "CANCELLED";
  note: string | null;
  createdAt: string;
  completedAt: string | null;
  fromWarehouse: ShopWarehouse;
  toWarehouse: ShopWarehouse;
  items: Array<{
    id: string;
    sourceInventoryItemId: string;
    catalogItemName: string;
    quantity: number;
    article: string | null;
    oem: string | null;
  }>;
};
export const getInventoryTransfers = (shopId?: string) =>
  request<InventoryTransfer[]>(
    `/inventory-transfers${shopId ? `?shopId=${shopId}` : ""}`,
  );
export const createInventoryTransfer = (data: {
  shopId?: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  note?: string;
  items: Array<{ sourceInventoryItemId: string; quantity: number }>;
}) =>
  request<InventoryTransfer>("/inventory-transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const completeInventoryTransfer = (id: string) =>
  request<InventoryTransfer>(`/inventory-transfers/${id}/complete`, {
    method: "POST",
  });
export const cancelInventoryTransfer = (id: string) =>
  request<InventoryTransfer>(`/inventory-transfers/${id}/cancel`, {
    method: "POST",
  });
export type InventoryHistory = {
  inventoryItem: {
    id: string;
    name: string;
    warehouse: string;
    quantity: number;
  };
  movements: Array<{
    id: string;
    type: string;
    quantityDelta: number;
    quantityBefore: number;
    quantityAfter: number;
    documentType: string | null;
    documentId: string | null;
    documentNumber: string | null;
    reason: string | null;
    createdBy: string | null;
    createdAt: string;
  }>;
};
export const getInventoryHistory = (id: string) =>
  request<InventoryHistory>(`/inventory-items/${id}/history`);
export const adjustInventory = (
  id: string,
  data: {
    type: "INCREASE" | "DECREASE" | "SET";
    quantity: number;
    reason: string;
  },
) =>
  request<InventoryItem>(`/inventory-items/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export type Stocktake = {
  id: string;
  shopId: string;
  warehouseId: string;
  number: string;
  status: "DRAFT" | "COMPLETED" | "CANCELLED";
  note: string | null;
  createdAt: string;
  completedAt: string | null;
  warehouse: ShopWarehouse;
  items: Array<{
    id: string;
    inventoryItemId: string;
    expectedQuantity: number;
    actualQuantity: number | null;
    difference: number | null;
    inventoryItem: InventoryItem;
  }>;
};
export const getStocktakes = (shopId?: string) =>
  request<Stocktake[]>(`/stocktakes${shopId ? `?shopId=${shopId}` : ""}`);
export const createStocktake = (data: {
  shopId?: string;
  warehouseId: string;
  note?: string;
}) =>
  request<Stocktake>("/stocktakes", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateStocktakeItems = (
  id: string,
  items: Array<{ inventoryItemId: string; actualQuantity: number }>,
) =>
  request<Stocktake>(`/stocktakes/${id}/items`, {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
export const completeStocktake = (id: string) =>
  request<Stocktake>(`/stocktakes/${id}/complete`, { method: "POST" });
export const cancelStocktake = (id: string) =>
  request<Stocktake>(`/stocktakes/${id}/cancel`, { method: "POST" });
export type InventoryAuditResponse = {
  summary: {
    inventoryItems: number;
    matched: number;
    mismatched: number;
    orphanMovements: number;
    movementsWithoutWarehouse: number;
    negativeInventory: number;
  };
  reservationSummary: {
    inventoryItemsWithReservations: number;
    reservationMismatches: number;
    reservedGreaterThanQuantity: number;
    expiredReservationsNotReleased: number;
  };
  rows: Array<{
    inventoryItemId: string;
    shopId: string;
    warehouseId: string | null;
    catalogItemName: string;
    warehouseName: string | null;
    currentQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    activeReservationQuantity: number;
    reservationDifference: number;
    calculatedQuantity: number;
    difference: number;
    movementCount: number;
    status: "OK" | "MISMATCH";
  }>;
  meta: Pagination;
};
export const getInventoryAudit = (
  params: {
    shopId?: string;
    warehouseId?: string;
    inventoryItemId?: string;
    onlyMismatches?: boolean;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<InventoryAuditResponse>(
    `/admin/inventory-audit?${documentQuery(params)}`,
  );

export type Customer = {
  id: string;
  fullName: string;
  phone: string;
  phoneNormalized: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
};
export const getCustomers = (search = "") =>
  request<Customer[]>(`/customers?${new URLSearchParams({ search })}`);
export const createCustomer = (data: {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  note?: string;
}) =>
  request<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
export type CustomerOrderStatus =
  | "DRAFT"
  | "RESERVED"
  | "CONFIRMED"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";
export type CustomerOrderItem = {
  id: string;
  inventoryItemId: string;
  shopId: string;
  warehouseId: string;
  catalogItemId: string;
  quantity: number;
  unitPrice: string;
  total: string;
  catalogItemName: string;
  shopName: string;
  warehouseName: string;
  article: string | null;
  oem: string | null;
  brand: string | null;
  reservationStatus: string;
};
export type CustomerOrder = {
  id: string;
  number: string;
  status: CustomerOrderStatus;
  customerId: string | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string | null;
  deliveryType: "PICKUP" | "DELIVERY";
  deliveryAddress: string | null;
  paymentStatus: string;
  subtotal: string;
  discount: string;
  deliveryFee: string;
  total: string;
  note: string | null;
  reservationExpiresAt: string | null;
  createdAt: string;
  items: CustomerOrderItem[];
  sales: Array<{
    id: string;
    number: string;
    shopId: string;
    totalAmount: string;
    status: string;
    shop: { id: string; name: string };
  }>;
  statusHistory: Array<{
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
    user: { firstName: string; lastName: string | null } | null;
  }>;
};
export type OrderInventorySearchItem = {
  inventoryItemId: string;
  catalogItemId: string;
  catalogItemName: string;
  shopId: string;
  shopName: string;
  warehouseId: string;
  warehouseName: string;
  article: string | null;
  oem: string | null;
  brand: string | null;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  salePrice: string;
};
export const searchOrderInventory = (
  params: {
    query?: string;
    shopId?: string;
    warehouseId?: string;
    catalogItemId?: string;
    onlyAvailable?: boolean;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<{ data: OrderInventorySearchItem[]; meta: Pagination }>(
    `/customer-orders/inventory-search?${documentQuery(params)}`,
  );
export const getCustomerOrders = (
  params: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    shopId?: string;
    expired?: boolean;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<{
    data: Array<
      Omit<CustomerOrder, "items" | "sales" | "statusHistory"> & {
        _count: { items: number };
      }
    >;
    meta: Pagination;
  }>(`/customer-orders?${documentQuery(params)}`);
export const getCustomerOrder = (id: string) =>
  request<CustomerOrder>(`/customer-orders/${id}`);
export const createCustomerOrder = (data: {
  customerId?: string;
  customer: { fullName: string; phone?: string };
  deliveryType: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  deliveryFee?: number;
  discount?: number;
  note?: string;
  items: Array<{
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
  }>;
}) =>
  request<CustomerOrder>("/customer-orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const reserveCustomerOrder = (id: string, expiresInMinutes = 120) =>
  request<CustomerOrder>(`/customer-orders/${id}/reserve`, {
    method: "POST",
    body: JSON.stringify({ expiresInMinutes }),
  });
export const confirmCustomerOrder = (id: string) =>
  request<CustomerOrder>(`/customer-orders/${id}/confirm`, { method: "POST" });
export const readyCustomerOrder = (id: string) =>
  request<CustomerOrder>(`/customer-orders/${id}/ready`, { method: "POST" });
export const completeCustomerOrder = (id: string) =>
  request<CustomerOrder>(`/customer-orders/${id}/complete`, { method: "POST" });
export const cancelCustomerOrder = (id: string, reason: string) =>
  request<CustomerOrder>(`/customer-orders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
export const extendCustomerOrder = (id: string, expiresInMinutes: number) =>
  request<CustomerOrder>(`/customer-orders/${id}/extend-reservation`, {
    method: "POST",
    body: JSON.stringify({ expiresInMinutes }),
  });
export const releaseExpiredCustomerOrders = () =>
  request<{ found: number; released: number }>(
    "/admin/customer-orders/release-expired",
    { method: "POST" },
  );
export type PaymentMethod =
  "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_WALLET" | "OTHER";
export type OrderPayment = {
  id: string;
  orderId: string;
  amount: string;
  method: PaymentMethod;
  status: "COMPLETED" | "CANCELLED" | "REFUNDED";
  transactionReference: string | null;
  note: string | null;
  receivedAt: string;
};
export type OrderFinance = {
  order: {
    number: string;
    total: string;
    paidAmount: string;
    dueAmount: string;
    paymentStatus: string;
  };
  platform: {
    productRevenue: string;
    deliveryRevenue: string;
    totalRevenue: string;
  };
  shops: Array<{
    shopId: string;
    shopName: string;
    salesTotal: string;
    payableAmount: string;
    paidToShop: string;
    outstandingToShop: string;
    payableId: string;
    saleId: string;
  }>;
  payments: OrderPayment[];
};
export const getOrderFinance = (id: string) =>
  request<OrderFinance>(`/customer-orders/${id}/finance`);
export const getOrderPayments = (id: string) =>
  request<OrderPayment[]>(`/customer-orders/${id}/payments`);
export const createOrderPayment = (
  id: string,
  data: {
    amount: number;
    method: PaymentMethod;
    transactionReference?: string;
    note?: string;
    receivedAt?: string;
  },
) =>
  request<OrderPayment>(`/customer-orders/${id}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const cancelOrderPayment = (
  orderId: string,
  paymentId: string,
  reason: string,
) =>
  request<OrderPayment>(
    `/customer-orders/${orderId}/payments/${paymentId}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
export const refundOrderPayment = (
  id: string,
  data: {
    amount: number;
    method?: PaymentMethod;
    reason: string;
    originalPaymentId?: string;
  },
) =>
  request<OrderPayment>(`/customer-orders/${id}/refunds`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export type ShopPayable = {
  id: string;
  shopId: string;
  customerOrderId: string;
  saleId: string;
  grossShopAmount: string;
  payableAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  status: string;
  shop: { id: string; name: string };
  sale: { id: string; number: string };
  customerOrder: { id: string; number: string };
};
export type ShopPayout = {
  id: string;
  number: string;
  shopId: string;
  amount: string;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  shop: { id: string; name: string };
  allocations: Array<{ id: string; payableId: string; amount: string }>;
};
export const getShopPayables = (
  params: {
    shopId?: string;
    status?: string;
    onlyOutstanding?: boolean;
    page?: number;
    limit?: number;
  } = {},
) =>
  request<{ data: ShopPayable[]; meta: Pagination }>(
    `/shop-payables?${documentQuery(params)}`,
  );
export const getShopPayouts = (shopId?: string) =>
  request<ShopPayout[]>(`/shop-payouts?${documentQuery({ shopId })}`);
export const createShopPayout = (data: {
  shopId: string;
  method: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER";
  transactionReference?: string;
  note?: string;
  allocations: Array<{ payableId: string; amount: number }>;
}) =>
  request<ShopPayout>("/shop-payouts", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const completeShopPayout = (id: string) =>
  request<ShopPayout>(`/shop-payouts/${id}/complete`, { method: "POST" });
export const cancelShopPayout = (id: string, reason: string) =>
  request<ShopPayout>(`/shop-payouts/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
export type ShopFinancialBalance = {
  totalSalesAmount: string;
  totalPayableAmount: string;
  totalPaidAmount: string;
  outstandingAmount: string;
  pendingCount: number;
  partiallyPaidCount: number;
  paidCount: number;
};
export const getShopFinancialBalance = (id: string) =>
  request<ShopFinancialBalance>(`/shops/${id}/financial-balance`);
export type FinanceAudit = {
  summary: {
    ordersChecked: number;
    orderAmountMismatches: number;
    paymentMismatches: number;
    payableMismatches: number;
    payoutMismatches: number;
    negativePlatformRevenue: number;
  };
  rows: Array<{
    entityType: string;
    entityId: string;
    number?: string;
    expected: string;
    actual: string;
    difference: string;
    message: string;
  }>;
};
export const getFinanceAudit = () =>
  request<FinanceAudit>("/admin/finance-audit");

export type VehicleCatalogManufacturer = {
  id: string;
  name: string;
  englishName: string | null;
  country: string | null;
  logo: string | null;
  _count: { vehicleModels: number };
  priorityGroup: "POPULAR_EV" | "OTHER";
  priorityRank: number | null;
};
export type VehicleCatalogSpecification = {
  id: string;
  generationId?: string | null;
  year: number;
  trim: string | null;
  variant: string | null;
  powertrainType: string;
  driveType: string | null;
  batteryGrossKwh: string | null;
  motorPowerKw: string | null;
  engineDisplacementCc?: number | null;
};
export type VehicleCatalogModel = {
  id: string;
  name: string;
  exportName?: string | null;
  startYear: number | null;
  endYear: number | null;
  powertrainType: string | null;
  manufacturer?: { id: string; name: string; logo: string | null };
  generations: Array<{
    id: string;
    name: string;
    startYear: number | null;
    endYear: number | null;
  }>;
  specifications: VehicleCatalogSpecification[];
};
export type VehicleQuickSearchResult = {
  type: "MODEL" | "SPECIFICATION";
  manufacturerId: string;
  manufacturerName: string;
  modelId: string;
  modelName: string;
  matchedAlias: string | null;
  generationId: string | null;
  generationName: string | null;
  specificationId: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  powertrain: string | null;
  specificationCount: number;
};
export const vehicleCatalogQuickSearch = (
  query: string,
  limit = 15,
  signal?: AbortSignal,
) =>
  request<{ data: VehicleQuickSearchResult[]; meta: Pagination }>(
    `/vehicles/search?search=${encodeURIComponent(query)}&page=1&limit=${limit}`,
    { signal },
  );
export type VehicleCatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { children?: number; partCatalogItems?: number };
};
export type VehicleCatalogItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: { id: string; name: string };
  oemPartCategories: Array<{
    oemPart: {
      id: string;
      displayNumber: string;
      description: string | null;
      outgoingCrossReferences: Array<{
        id: string;
        externalPartNumber: string | null;
        partBrand: { id: string; officialName: string } | null;
      }>;
    };
  }>;
  offers: Array<{
    id: string;
    price: string;
    currency: string;
    quantity: number;
    reservedQuantity: number;
    brand: string | null;
    sku: string | null;
    oemNumber: string | null;
    externalPartNumber: string | null;
    shop: { id: string; name: string };
    partBrand: { id: string; officialName: string } | null;
  }>;
};
export const searchVehicles = (search: string, page = 1, limit = 20) =>
  request<{ data: VehicleCatalogModel[]; meta: Pagination }>(
    `/vehicles/search?${documentQuery({ search, page, limit })}`,
  );
export const getVehicleManufacturers = (
  search = "",
  page = 1,
  limit = 20,
  signal?: AbortSignal,
) =>
  request<{ data: VehicleCatalogManufacturer[]; meta: Pagination }>(
    `/vehicles/manufacturers?${documentQuery({ search, page, limit })}`,
    { signal },
  );
export const getVehicleCatalogModels = (
  manufacturerId: string,
  search = "",
  page = 1,
  limit = 100,
) =>
  request<{ data: VehicleCatalogModel[]; meta: Pagination }>(
    `/vehicles/${manufacturerId}/models?${documentQuery({ search, page, limit })}`,
  );
export const getVehicleCatalogModel = (id: string) =>
  request<VehicleCatalogModel>(`/vehicles/models/${id}`);
export const getVehicleSpecification = (id: string) =>
  request<
    VehicleCatalogSpecification & {
      vehicleModel: {
        id: string;
        name: string;
        manufacturer: { id: string; name: string; logo: string | null };
      };
      generation: {
        id: string;
        name: string;
        startYear: number | null;
        endYear: number | null;
      } | null;
      transmissionType: string | null;
      enginePowerKw: string | null;
      batteryUsableKwh: string | null;
      platform: string | null;
    }
  >(`/vehicles/specifications/${id}`);
export const getVehicleCategories = (id: string) =>
  request<VehicleCatalogCategory[]>(
    `/vehicles/specifications/${id}/categories`,
  );
export const getVehicleCategory = (id: string, categoryId: string) =>
  request<
    VehicleCatalogCategory & {
      parent: { id: string; name: string } | null;
      children: VehicleCatalogCategory[];
    }
  >(`/vehicles/specifications/${id}/categories/${categoryId}`);
export const getVehicleCategoryItems = (
  id: string,
  categoryId: string,
  sort = "price",
  page = 1,
  limit = 50,
) =>
  request<{ data: VehicleCatalogItem[]; meta: Pagination }>(
    `/vehicles/specifications/${id}/categories/${categoryId}/items?${documentQuery({ sort, page, limit })}`,
  );

export type VehicleFitmentCategory = {
  id: string;
  name: string;
  itemsCount: number;
};
export type VehicleFitmentOffer = {
  id: string;
  price: string;
  currency: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  sku: string | null;
  oemNumber: string | null;
  externalPartNumber: string | null;
  kind: "ORIGINAL" | "ANALOG";
  shop: { name: string };
  partBrand: { id: string; officialName: string } | null;
};
export type VehicleFitmentPart = {
  id: string;
  number: string;
  displayNumber: string;
  description: string | null;
  manufacturer: { id: string; name: string };
  categories: Array<{
    isPrimary: boolean;
    catalogItem: {
      id: string;
      name: string;
      description: string | null;
      category: { id: string; name: string };
    };
  }>;
  outgoingCrossReferences: Array<{
    id: string;
    relationType: string;
    confidence: number;
    externalPartNumber: string | null;
    partBrand: { id: string; officialName: string } | null;
    toOemPart: {
      id: string;
      displayNumber: string;
      manufacturer: { id: string; name: string };
    } | null;
  }>;
  analogsCount: number;
  shopsCount: number;
  offersCount: number;
  minimumPrice: string | null;
  availableQuantity: number;
  offers: VehicleFitmentOffer[];
};
export type VehicleFitmentOverview = {
  vehicle: {
    id: string;
    year: number;
    trim: string | null;
    variant: string | null;
    powertrainType: string;
    vehicleModel: {
      id: string;
      name: string;
      manufacturer: { id: string; name: string };
    };
    generation: { id: string; name: string } | null;
  };
  categories: VehicleFitmentCategory[];
  hasConfirmedFitments: boolean;
  message: string | null;
};
export const getVehicleFitment = (id: string) =>
  request<VehicleFitmentOverview>(`/vehicle-fitment/specifications/${id}`);
export const getVehicleFitmentCategory = (
  id: string,
  categoryId: string,
  params: {
    originalOnly?: boolean;
    analogOnly?: boolean;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    manufacturerId?: string;
    brandId?: string;
    sort?: "price" | "availability" | "shops" | "brand";
    page?: number;
    limit?: number;
  } = {},
) =>
  request<{
    category: { id: string; name: string; description: string | null };
    parts: VehicleFitmentPart[];
    meta: Pagination;
    message: string | null;
  }>(
    `/vehicle-fitment/specifications/${id}/categories/${categoryId}?${documentQuery(params)}`,
  );
export const getVehicleFitmentPart = (
  oemId: string,
  params: Record<string, string | number | boolean | undefined> = {},
) =>
  request<{
    original: VehicleFitmentPart;
    crossReferences: VehicleFitmentPart["outgoingCrossReferences"];
    brands: Array<{ id: string; officialName: string }>;
    offers: VehicleFitmentOffer[];
  }>(`/vehicle-fitment/parts/${oemId}?${documentQuery(params)}`);

export type VehicleRegistryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type VehicleRegistryPage = {
  data: VehicleRegistryItem[];
  meta: Pagination;
};
export const getVehicleRegistry = (
  resource: string,
  params: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  } = {},
) =>
  request<VehicleRegistryPage>(
    `/vehicle-database/${resource}?${documentQuery(params)}`,
  );
export const createVehicleRegistryItem = (
  resource: string,
  data: { name: string; slug: string; description?: string },
) =>
  request<VehicleRegistryItem>(`/vehicle-database/${resource}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateVehicleRegistryItem = (
  resource: string,
  id: string,
  data: Partial<{ name: string; slug: string; description: string }>,
) =>
  request<VehicleRegistryItem>(`/vehicle-database/${resource}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deactivateVehicleRegistryItem = (resource: string, id: string) =>
  request<VehicleRegistryItem>(`/vehicle-database/${resource}/${id}`, {
    method: "DELETE",
  });
export const restoreVehicleRegistryItem = (resource: string, id: string) =>
  request<VehicleRegistryItem>(`/vehicle-database/${resource}/${id}/restore`, {
    method: "POST",
  });
