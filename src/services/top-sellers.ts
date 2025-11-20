import type {
  TopSeller,
  ApiResponse,
  TopSellerPayload,
  PaginatedResponse,
  TopSellersQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all top sellers with pagination, filtering, and sorting
export async function getAllTopSellers(
  params: TopSellersQueryParams = {}
): Promise<PaginatedResponse<TopSeller>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.store_code) queryParams.append('store_code', params.store_code);
  if (params.is_active !== undefined)
    queryParams.append('is_active', params.is_active.toString());
  if (params.sort) queryParams.append('sort', params.sort);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/top-sellers${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<TopSeller>>(endpoint);
}

// Get single top seller by ID
export async function getTopSellerById(id: string): Promise<ApiResponse<TopSeller>> {
  return apiClient.get<ApiResponse<TopSeller>>(`/api/admin/content/top-sellers/${id}`);
}

// Create new top seller
export async function createTopSeller(
  data: TopSellerPayload
): Promise<ApiResponse<TopSeller>> {
  return apiClient.post<ApiResponse<TopSeller>>('/api/admin/content/top-sellers', data);
}

// Update existing top seller
export async function updateTopSeller(
  id: string,
  data: TopSellerPayload
): Promise<ApiResponse<TopSeller>> {
  return apiClient.put<ApiResponse<TopSeller>>(`/api/admin/content/top-sellers/${id}`, data);
}

// Delete top seller
export async function deleteTopSeller(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/top-sellers/${id}`);
}

