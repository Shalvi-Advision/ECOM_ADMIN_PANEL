import type {
  ApiResponse,
  Advertisement,
  PaginatedResponse,
  AdvertisementPayload,
  AdvertisementsQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all advertisements with pagination, filtering, and sorting
export async function getAllAdvertisements(
  params: AdvertisementsQueryParams = {}
): Promise<PaginatedResponse<Advertisement>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.store_code) queryParams.append('store_code', params.store_code);
  if (params.category) queryParams.append('category', params.category);
  if (params.is_active !== undefined)
    queryParams.append('is_active', params.is_active.toString());
  if (params.sort) queryParams.append('sort', params.sort);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/advertisements${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<Advertisement>>(endpoint);
}

// Get single advertisement by ID
export async function getAdvertisementById(id: string): Promise<ApiResponse<Advertisement>> {
  return apiClient.get<ApiResponse<Advertisement>>(`/api/admin/content/advertisements/${id}`);
}

// Create new advertisement
export async function createAdvertisement(
  data: AdvertisementPayload
): Promise<ApiResponse<Advertisement>> {
  return apiClient.post<ApiResponse<Advertisement>>('/api/admin/content/advertisements', data);
}

// Update existing advertisement
export async function updateAdvertisement(
  id: string,
  data: AdvertisementPayload
): Promise<ApiResponse<Advertisement>> {
  return apiClient.put<ApiResponse<Advertisement>>(
    `/api/admin/content/advertisements/${id}`,
    data
  );
}

// Delete advertisement
export async function deleteAdvertisement(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/advertisements/${id}`);
}
