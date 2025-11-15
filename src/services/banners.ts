import type {
  Banner,
  ApiResponse,
  BannerPayload,
  PaginatedResponse,
  BannersQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all banners with pagination, filtering, and sorting
export async function getAllBanners(
  params: BannersQueryParams = {}
): Promise<PaginatedResponse<Banner>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.section_name) queryParams.append('section_name', params.section_name);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/banners${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<Banner>>(endpoint);
}

// Get single banner by ID
export async function getBannerById(id: string): Promise<ApiResponse<Banner>> {
  return apiClient.get<ApiResponse<Banner>>(`/api/admin/content/banners/${id}`);
}

// Create new banner
export async function createBanner(data: BannerPayload): Promise<ApiResponse<Banner>> {
  return apiClient.post<ApiResponse<Banner>>('/api/admin/content/banners', data);
}

// Update existing banner
export async function updateBanner(
  id: string,
  data: BannerPayload
): Promise<ApiResponse<Banner>> {
  return apiClient.put<ApiResponse<Banner>>(`/api/admin/content/banners/${id}`, data);
}

// Delete banner
export async function deleteBanner(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/banners/${id}`);
}
