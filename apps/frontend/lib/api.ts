import { clearSession, getToken } from './auth';
const baseUrl = process.env.NEXT_PUBLIC_API_URL;
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> { if (!baseUrl) throw new ApiError(0, 'Не задан NEXT_PUBLIC_API_URL'); const token = getToken(); const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}), ...options.headers } }); const body = await response.json().catch(() => null); if (!response.ok) { if (response.status === 401) { clearSession(); if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:unauthorized')); } throw new ApiError(response.status, body?.message ?? 'Ошибка запроса'); } return body as T; }
export type LoginResponse = { accessToken:string; tokenType:string; user: import('./auth').AuthUser };
export const login = (phone:string,password:string) => request<LoginResponse>('/auth/login',{method:'POST',body:JSON.stringify({phone,password})});
export type UserRole='SUPER_ADMIN'|'SHOP_ADMIN'|'MANAGER'|'SELLER'|'VIEWER'; export type CurrentUser={id:string;firstName:string;lastName:string|null;phone:string;role:UserRole;shopId:string|null;isActive:boolean;shop:{id:string;name:string;isActive:boolean}|null;permissions:string[]}; export const getCurrentUser=()=>request<{user:CurrentUser}>('/auth/me');
export type SearchResponse={items:Array<{inventoryItemId:string;partCatalogItemId:string;internalCode:string;name:string;slug:string;oemNumber:string|null;category:{id:string;name:string};manufacturer:{id:string;name:string}|null;shop:{id:string;name:string};price:string;quantity:number;availableQuantity:number;isActive:boolean}>;pagination:{page:number;limit:number;total:number;totalPages:number}};
export function searchInventory(params:Record<string,string|number|boolean|undefined>) { const query=new URLSearchParams(); Object.entries(params).forEach(([key,value])=>value!==undefined&&query.set(key,String(value))); return request<SearchResponse>(`/inventory-search?${query}`); }
export type InventoryItem={id:string;partCatalogItemId:string;brand:string|null;sku:string|null;oemNumber:string|null;compatibility:string|null;condition:string;price:string;currency:string;quantity:number;minQuantity:number;location:string|null;notes:string|null;imageUrl:string|null;imagePublicId:string|null;isActive:boolean;shop:{id:string;name:string};partCatalogItem:{name:string;internalCode:string;category:{name:string};compatibilities:Array<{vehicleGeneration:{name:string;vehicleModel:{name:string;manufacturer:{name:string}}}}>}};
export type InventoryList={data:InventoryItem[];meta:{page:number;limit:number;total:number;totalPages:number}};
export function inventoryList(params:Record<string,string|number|boolean|undefined>){const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>v!==undefined&&q.set(k,String(v)));return request<InventoryList>(`/inventory-items?${q}`)}
export const inventoryOne=(id:string)=>request<InventoryItem>(`/inventory-items/${id}`);
export type InventoryPayload={partCatalogItemId?:string;brand?:string;sku?:string;oemNumber?:string;compatibility?:string|null;condition?:string;price?:number;currency?:string;quantity?:number;minQuantity?:number;location?:string|null;notes?:string;isActive?:boolean};
export const createInventory=(data:InventoryPayload)=>request<InventoryItem>('/inventory-items',{method:'POST',body:JSON.stringify(data)});
export const updateInventory=(id:string,data:InventoryPayload)=>request<InventoryItem>(`/inventory-items/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteInventory=(id:string)=>request<InventoryItem>(`/inventory-items/${id}`,{method:'DELETE'});
export async function uploadInventoryImage(id:string,image:File){if(!baseUrl)throw new ApiError(0,'Не задан NEXT_PUBLIC_API_URL');const form=new FormData();form.append('image',image);const token=getToken();const response=await fetch(`${baseUrl}/inventory-items/${id}/image`,{method:'POST',headers:{...(token?{Authorization:`Bearer ${token}`}:{})},body:form});const body=await response.json().catch(()=>null);if(!response.ok)throw new ApiError(response.status,body?.message??'Не удалось загрузить фото');return body as InventoryItem}
export const deleteInventoryImage=(id:string)=>request<InventoryItem>(`/inventory-items/${id}/image`,{method:'DELETE'});
export type CatalogItem={id:string;name:string;internalCode:string;slug:string;category:{name:string};compatibilities:Array<{vehicleGeneration:{name:string;vehicleModel:{name:string;manufacturer:{name:string}}}}>};
export type CatalogList={data:CatalogItem[];meta:{page:number;limit:number;total:number;totalPages:number}};
export function catalogSearch(search:string){return request<CatalogList>(`/part-catalog?${new URLSearchParams({search,isActive:'true',limit:'10'})}`)}
export type PartCatalogCandidateMatchType='EXACT_NORMALIZED_NAME'|'SAME_TOKENS'|'PARTIAL_TOKENS'|'NAME_CONTAINS';
export type PartCatalogCandidate={id:string;internalCode:string;name:string;slug:string;categoryId:string;category:{id:string;name:string};side:string;position:string;normalizedName:string;matchType:PartCatalogCandidateMatchType;matchedTokens:string[]};
export function getPartCatalogCandidates(params:{q:string;categoryId?:string;side?:string;position?:string;limit?:number}){const query=new URLSearchParams();Object.entries(params).forEach(([key,value])=>value!==undefined&&query.set(key,String(value)));return request<{items:PartCatalogCandidate[]}>(`/part-catalog/candidates?${query}`)}
export type PartCatalogEntry={id:string;internalCode:string;name:string;slug:string;description:string|null;categoryId:string;category:{id:string;name:string};side:'NONE'|'LEFT'|'RIGHT';position:'NONE'|'FRONT'|'REAR';isUniversal:boolean;isActive:boolean;normalizedName:string;searchTokens:string};
export type PartCatalogResponse={data:PartCatalogEntry[];meta:Pagination};
export type PartCatalogPayload={name:string;slug:string;description?:string;categoryId:string;side?:PartCatalogEntry['side'];position?:PartCatalogEntry['position'];isUniversal?:boolean;isActive?:boolean};
export const getPartCatalog=(params:{search?:string;page?:number;limit?:number;isActive?:boolean}={})=>request<PartCatalogResponse>(`/part-catalog?${documentQuery(params)}`);
export const getPartCatalogItem=(id:string)=>request<PartCatalogEntry>(`/part-catalog/${id}`);
export const createPartCatalogItem=(data:PartCatalogPayload)=>request<PartCatalogEntry>('/part-catalog',{method:'POST',body:JSON.stringify(data)});
export const updatePartCatalogItem=(id:string,data:Partial<PartCatalogPayload>)=>request<PartCatalogEntry>(`/part-catalog/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export type PartCategoryOption={id:string;name:string;slug:string;description?:string|null;parentId?:string|null;sortOrder?:number;isActive:boolean;parent:{id:string;name:string}|null;_count:{children:number}};
export type PartCategoryTreeNode={id:string;name:string;slug:string;description:string|null;parentId:string|null;sortOrder:number;isActive:boolean;children:PartCategoryTreeNode[]};
export type PartCategoryPayload={name:string;slug:string;description?:string;parentId?:string|null;sortOrder?:number;isActive?:boolean};
export type PartCategoriesQuery = {
  search?: string;
  limit?: number;
  page?: number;
  isActive?: boolean;
  leafOnly?: boolean;
};

export const getPartCategories = (
  params: PartCategoriesQuery = {},
) =>
  request<{ data: PartCategoryOption[]; meta: Pagination }>(
    `/part-categories?${documentQuery({
      search: params.search,
      isActive: params.isActive ?? true,
      leafOnly: params.leafOnly,
      limit: params.limit ?? 20,
      page: params.page ?? 1,
    })}`,
  );
export const getPartCategoryTree=(includeInactive=false)=>request<PartCategoryTreeNode[]>(`/part-categories/tree?isActive=${includeInactive?'false':'true'}`);
export const getPartCategory=(id:string)=>request<PartCategoryOption & {children:PartCategoryOption[]}>(`/part-categories/${id}`);
export const createPartCategory=(data:PartCategoryPayload)=>request<PartCategoryOption>('/part-categories',{method:'POST',body:JSON.stringify(data)});
export const updatePartCategory=(id:string,data:Partial<PartCategoryPayload>)=>request<PartCategoryOption>(`/part-categories/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deactivatePartCategory=(id:string)=>request<PartCategoryOption>(`/part-categories/${id}`,{method:'DELETE'});
export type Movement={id:string;type:string;change:number;quantityAfter:number;reference:string|null;notes:string|null;createdAt:string};
export const inventoryMovements=(id:string)=>request<{data:Movement[];meta:{page:number;total:number} }>(`/inventory-items/${id}/movements`);
export const createSale=(data:object)=>request<{id:string}>('/sales',{method:'POST',body:JSON.stringify(data)});
export const createPurchase=(data:object)=>request<{id:string}>('/purchases',{method:'POST',body:JSON.stringify(data)});
export type ImportPreviewRowStatus = 'valid' | 'invalid' | 'requires_review';
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
export type Shop={id:string;name:string;ownerName:string|null;phone:string|null;whatsapp:string|null;email:string|null;country:string|null;city:string|null;address:string|null;latitude:number|null;longitude:number|null;isActive:boolean;createdAt:string;updatedAt:string};
export type ShopPayload=Partial<Omit<Shop,'id'|'isActive'|'createdAt'|'updatedAt'>> & {name:string};
export const getShops=(includeInactive=false)=>request<Shop[]>(`/shops${includeInactive?'?includeInactive=true':''}`);
export const shops=()=>getShops();
export const getShop=(id:string)=>request<Shop>(`/shops/${id}`);
export const createShop=(data:ShopPayload)=>request<Shop>('/shops',{method:'POST',body:JSON.stringify(data)});
export const updateShop=(id:string,data:Partial<ShopPayload>&{isActive?:boolean})=>request<Shop>(`/shops/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deactivateShop=(id:string)=>request<Shop>(`/shops/${id}/deactivate`,{method:'POST'});
export async function importPreview(file: File, options: { shopId?: string; mapping?: Partial<InventoryImportMapping> } = {}) {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  if (options.shopId) form.append('shopId', options.shopId);
  if (options.mapping?.partNumberColumn) form.append('partNumberColumn', options.mapping.partNumberColumn);
  if (options.mapping?.nameColumn) form.append('nameColumn', options.mapping.nameColumn);
  if (options.mapping?.compatibilityColumn) form.append('compatibilityColumn', options.mapping.compatibilityColumn);
  if (options.mapping?.storageLocationColumn) form.append('storageLocationColumn', options.mapping.storageLocationColumn);
  if (options.mapping?.priceColumn) form.append('priceColumn', options.mapping.priceColumn);
  if (options.mapping?.quantityColumn) form.append('quantityColumn', options.mapping.quantityColumn);
  const response = await fetch(`${baseUrl}/inventory-import/preview`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(response.status, body?.message ?? 'Ошибка проверки файла');
  }
  return body as InventoryImportPreviewResponse;
}
export async function confirmInventoryImport(file: File, options: { shopId?: string; mapping: InventoryImportMapping }) {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  if (options.shopId) form.append('shopId', options.shopId);
  if (options.mapping.partNumberColumn) form.append('partNumberColumn', options.mapping.partNumberColumn);
  form.append('nameColumn', options.mapping.nameColumn);
  if (options.mapping.compatibilityColumn) form.append('compatibilityColumn', options.mapping.compatibilityColumn);
  if (options.mapping.storageLocationColumn) form.append('storageLocationColumn', options.mapping.storageLocationColumn);
  form.append('priceColumn', options.mapping.priceColumn);
  form.append('quantityColumn', options.mapping.quantityColumn);
  const response = await fetch(`${baseUrl}/inventory-import/confirm`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(response.status, body?.message ?? 'Ошибка импорта');
  }
  return body as InventoryImportConfirmResponse;
}
export type SaleStatus='COMPLETED'|'CANCELLED';
export type PurchaseStatus='COMPLETED'|'CANCELLED';
export type DocumentShop={id:string;name:string};
export type DocumentUser={id:string;phone:string;firstName:string;lastName:string|null};
export type DocumentInventoryItem={id:string;sku:string|null;oemNumber:string|null;price:string;quantity:number;currency:string};
export type DocumentCatalogItem={id:string;name:string;internalCode:string;category:{id:string;name:string}};
export type SaleItem={id:string;itemName:string;brand:string|null;sku:string|null;oemNumber:string|null;quantity:number;unitPrice:string;lineTotal:string;inventoryItem:DocumentInventoryItem;partCatalogItem:DocumentCatalogItem};
export type PurchaseItem={id:string;itemName:string;brand:string|null;sku:string|null;oemNumber:string|null;quantity:number;purchasePrice:string;salePrice:string|null;lineTotal:string;inventoryItem:DocumentInventoryItem;partCatalogItem:DocumentCatalogItem};
export type SaleListItem={id:string;number:string;status:SaleStatus;createdAt:string;currency:string;subtotal:string;discount:string;totalAmount:string;customerName:string|null;customerPhone:string|null;shop:DocumentShop;_count:{items:number}};
export type PurchaseListItem={id:string;number:string;status:PurchaseStatus;purchasedAt:string;currency:string;subtotal:string;discount:string;totalAmount:string;supplierName:string|null;supplierPhone:string|null;shop:DocumentShop;_count:{items:number}};
export type SaleDetails=SaleListItem&{notes:string|null;user:DocumentUser;items:SaleItem[];cancelledAt:string|null;cancelledBy:DocumentUser|null;cancelReason:string|null};
export type PurchaseDetails=PurchaseListItem&{invoiceNumber:string|null;notes:string|null;user:DocumentUser;items:PurchaseItem[];cancelledAt:string|null;cancelledBy:DocumentUser|null;cancelReason:string|null};
export type Pagination={page:number;limit:number;total:number;totalPages:number};
export type SaleListResponse={data:SaleListItem[];meta:Pagination};
export type PurchaseListResponse={data:PurchaseListItem[];meta:Pagination};
export type SalesQuery={page?:number;limit?:number;search?:string;status?:SaleStatus;dateFrom?:string;dateTo?:string;shopId?:string};
export type PurchasesQuery={page?:number;limit?:number;search?:string;status?:PurchaseStatus;dateFrom?:string;dateTo?:string;shopId?:string};
function documentQuery(params:Record<string,string|number|boolean|undefined>){const query=new URLSearchParams();Object.entries(params).forEach(([key,value])=>value!==undefined&&value!==''&&query.set(key,String(value)));return query.toString()}
export const getSales=(params:SalesQuery={})=>request<SaleListResponse>(`/sales?${documentQuery(params)}`);
export const getSaleById=(id:string)=>request<SaleDetails>(`/sales/${id}`);
export const cancelSale=(id:string,reason:string)=>request<SaleDetails>(`/sales/${id}/cancel`,{method:'POST',body:JSON.stringify({reason})});
export const getPurchases=(params:PurchasesQuery={})=>request<PurchaseListResponse>(`/purchases?${documentQuery(params)}`);
export const getPurchaseById=(id:string)=>request<PurchaseDetails>(`/purchases/${id}`);
export const cancelPurchase=(id:string,reason:string)=>request<PurchaseDetails>(`/purchases/${id}/cancel`,{method:'POST',body:JSON.stringify({reason})});
export type DashboardPeriod={dateFrom:string;dateTo:string};
export type DashboardSalesSummary={count:number;revenue:string;itemsSold:number};
export type DashboardPurchasesSummary={count:number;total:string;itemsPurchased:number};
export type DashboardInventorySummary={activeItems:number;totalQuantity:number;lowStockItems:number;outOfStockItems:number};
export type DashboardRecentSale={id:string;number:string;createdAt:string;totalAmount:string;currency:string;shop:DocumentShop};
export type DashboardRecentPurchase={id:string;number:string;purchasedAt:string;supplierName:string|null;totalAmount:string;currency:string;shop:DocumentShop};
export type DashboardTopSellingItem={inventoryItemId:string;partCatalogItemId:string;name:string;internalCode:string|null;oemNumber:string|null;quantity:number;total:string};
export type DashboardSummary={period:DashboardPeriod;sales:DashboardSalesSummary;purchases:DashboardPurchasesSummary;inventory:DashboardInventorySummary;recentSales:DashboardRecentSale[];recentPurchases:DashboardRecentPurchase[];topSellingItems:DashboardTopSellingItem[]};
export type DashboardQuery={shopId?:string;dateFrom?:string;dateTo?:string;lowStockThreshold?:number};
export const getDashboardSummary=(params:DashboardQuery={})=>request<DashboardSummary>(`/dashboard/summary?${documentQuery(params)}`);

export type EmployeeRole = Exclude<UserRole, 'SUPER_ADMIN'>;
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
  Pick<Employee, 'firstName' | 'lastName' | 'phone' | 'role' | 'isActive'>
>;
export type ResetEmployeePasswordPayload = { temporaryPassword: string };
export const getEmployees = (params: EmployeesQuery = {}) =>
  request<EmployeesList>(`/employees?${documentQuery(params)}`);
export const getEmployee = (id: string, shopId?: string) =>
  request<Employee>(`/employees/${id}${shopId ? `?shopId=${shopId}` : ''}`);
export const createEmployee = (payload: CreateEmployeePayload) =>
  request<Employee>('/employees', { method: 'POST', body: JSON.stringify(payload) });
export const updateEmployee = (id: string, payload: UpdateEmployeePayload, shopId?: string) =>
  request<Employee>(`/employees/${id}${shopId ? `?shopId=${shopId}` : ''}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
export const resetEmployeePassword = (
  id: string,
  payload: ResetEmployeePasswordPayload,
  shopId?: string,
) =>
  request<{ success: boolean; message: string }>(
    `/employees/${id}/reset-password${shopId ? `?shopId=${shopId}` : ''}`,
    { method: 'POST', body: JSON.stringify(payload) },
  );
