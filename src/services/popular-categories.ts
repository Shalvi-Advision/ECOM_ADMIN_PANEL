import type {
  ApiResponse,
  PopularCategory,
  PaginatedResponse,
  PopularCategoryPayload,
  PopularCategoriesQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all popular categories with pagination, filtering, and sorting
export async function getAllPopularCategories(
  params: PopularCategoriesQueryParams = {}
): Promise<PaginatedResponse<PopularCategory>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.store_code) queryParams.append('store_code', params.store_code);
  if (params.is_active !== undefined)
    queryParams.append('is_active', params.is_active.toString());
  if (params.sort) queryParams.append('sort', params.sort);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/popular-categories${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<PopularCategory>>(endpoint);
}

// Get single popular category by ID
export async function getPopularCategoryById(id: string): Promise<ApiResponse<PopularCategory>> {
  return apiClient.get<ApiResponse<PopularCategory>>(
    `/api/admin/content/popular-categories/${id}`
  );
}

// Create new popular category
export async function createPopularCategory(
  data: PopularCategoryPayload
): Promise<ApiResponse<PopularCategory>> {
  return apiClient.post<ApiResponse<PopularCategory>>(
    '/api/admin/content/popular-categories',
    data
  );
}

// Update existing popular category
export async function updatePopularCategory(
  id: string,
  data: PopularCategoryPayload
): Promise<ApiResponse<PopularCategory>> {
  return apiClient.put<ApiResponse<PopularCategory>>(
    `/api/admin/content/popular-categories/${id}`,
    data
  );
}

// Delete popular category
export async function deletePopularCategory(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/popular-categories/${id}`);
}
