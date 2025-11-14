import type { Category, PaginatedResponse, CategoriesQueryParams } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get categories by store code (POST endpoint)
export async function getCategoriesByStore(
  params: CategoriesQueryParams
): Promise<PaginatedResponse<Category>> {
  return apiClient.post<PaginatedResponse<Category>>('/api/admin/categories/by-store', params);
}
