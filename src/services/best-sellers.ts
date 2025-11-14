import type {
  BestSeller,
  ApiResponse,
  BestSellerPayload,
  PaginatedResponse,
  BestSellersQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all best sellers with pagination, filtering, and sorting
export async function getAllBestSellers(
  params: BestSellersQueryParams = {}
): Promise<PaginatedResponse<BestSeller>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.store_code) queryParams.append('store_code', params.store_code);
  if (params.is_active !== undefined)
    queryParams.append('is_active', params.is_active.toString());
  if (params.sort) queryParams.append('sort', params.sort);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/best-sellers${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<BestSeller>>(endpoint);
}

// Get single best seller by ID
export async function getBestSellerById(id: string): Promise<ApiResponse<BestSeller>> {
  return apiClient.get<ApiResponse<BestSeller>>(`/api/admin/content/best-sellers/${id}`);
}

// Create new best seller
export async function createBestSeller(
  data: BestSellerPayload
): Promise<ApiResponse<BestSeller>> {
  return apiClient.post<ApiResponse<BestSeller>>('/api/admin/content/best-sellers', data);
}

// Update existing best seller
export async function updateBestSeller(
  id: string,
  data: BestSellerPayload
): Promise<ApiResponse<BestSeller>> {
  return apiClient.put<ApiResponse<BestSeller>>(`/api/admin/content/best-sellers/${id}`, data);
}

// Delete best seller
export async function deleteBestSeller(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/best-sellers/${id}`);
}
