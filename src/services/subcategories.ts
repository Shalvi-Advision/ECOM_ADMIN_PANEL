import type { Subcategory, PaginatedResponse, SubcategoriesQueryParams } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get subcategories by store code (POST endpoint)
export async function getSubcategoriesByStore(
  params: SubcategoriesQueryParams
): Promise<PaginatedResponse<Subcategory>> {
  return apiClient.post<PaginatedResponse<Subcategory>>(
    '/api/admin/categories/subcategories/by-store',
    params
  );
}
