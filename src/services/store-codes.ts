import type { StoreCode, ApiResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all unique store codes with store names
export async function getStoreCodes(): Promise<ApiResponse<StoreCode[]>> {
  return apiClient.get<ApiResponse<StoreCode[]>>('/api/admin/content/stores/codes');
}
