import type {
  ApiResponse,
  SeasonalCategory,
  PaginatedResponse,
  SeasonalCategoryPayload,
  SeasonalCategoriesQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all seasonal categories with pagination and sorting
export async function getAllSeasonalCategories(
  params: SeasonalCategoriesQueryParams = {}
): Promise<PaginatedResponse<SeasonalCategory>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/seasonal-categories${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<SeasonalCategory>>(endpoint);
}

// Get single seasonal category by ID
export async function getSeasonalCategoryById(
  id: string
): Promise<ApiResponse<SeasonalCategory>> {
  return apiClient.get<ApiResponse<SeasonalCategory>>(
    `/api/admin/content/seasonal-categories/${id}`
  );
}

// Create new seasonal category
export async function createSeasonalCategory(
  data: SeasonalCategoryPayload
): Promise<ApiResponse<SeasonalCategory>> {
  return apiClient.post<ApiResponse<SeasonalCategory>>(
    '/api/admin/content/seasonal-categories',
    data
  );
}

// Update existing seasonal category
export async function updateSeasonalCategory(
  id: string,
  data: SeasonalCategoryPayload
): Promise<ApiResponse<SeasonalCategory>> {
  return apiClient.put<ApiResponse<SeasonalCategory>>(
    `/api/admin/content/seasonal-categories/${id}`,
    data
  );
}

// Delete seasonal category
export async function deleteSeasonalCategory(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/seasonal-categories/${id}`);
}
