import type { Product, PaginatedResponse, ProductsQueryParams } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get products by store code (POST endpoint)
export async function getProductsByStore(
  params: ProductsQueryParams
): Promise<PaginatedResponse<Product>> {
  return apiClient.post<PaginatedResponse<Product>>('/api/admin/products/by-store', params);
}
