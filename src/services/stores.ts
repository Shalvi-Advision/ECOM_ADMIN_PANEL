import type {
  Store,
  StoreCode,
  ApiResponse,
  StorePayload,
  StoresQueryParams,
  PaginatedResponse,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all stores with pagination, search, and sorting
export async function getAllStores(
  params: StoresQueryParams = {}
): Promise<PaginatedResponse<Store>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/stores${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<Store>>(endpoint);
}

// Get single store by ID
export async function getStoreById(id: string): Promise<ApiResponse<Store>> {
  return apiClient.get<ApiResponse<Store>>(`/api/admin/content/stores/${id}`);
}

// Create new store
export async function createStore(data: StorePayload): Promise<ApiResponse<Store>> {
  return apiClient.post<ApiResponse<Store>>('/api/admin/content/stores', data);
}

// Update existing store
export async function updateStore(
  id: string,
  data: StorePayload
): Promise<ApiResponse<Store>> {
  return apiClient.put<ApiResponse<Store>>(`/api/admin/content/stores/${id}`, data);
}

// Delete store
export async function deleteStore(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/stores/${id}`);
}

// Get all store codes for store selector
export async function getAllStoreCodes(): Promise<ApiResponse<StoreCode[]>> {
  return apiClient.get<ApiResponse<StoreCode[]>>('/api/admin/content/stores/codes');
}
