import type {
  PaymentMode,
  ApiResponse,
  PaginatedResponse,
  PaymentModePayload,
  PaymentModesQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all payment modes with pagination and sorting
export async function getAllPaymentModes(
  params: PaymentModesQueryParams = {}
): Promise<PaginatedResponse<PaymentMode>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/payment-modes${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<PaymentMode>>(endpoint);
}

// Get single payment mode by ID
export async function getPaymentModeById(id: string): Promise<ApiResponse<PaymentMode>> {
  return apiClient.get<ApiResponse<PaymentMode>>(`/api/admin/content/payment-modes/${id}`);
}

// Create new payment mode
export async function createPaymentMode(
  data: PaymentModePayload
): Promise<ApiResponse<PaymentMode>> {
  return apiClient.post<ApiResponse<PaymentMode>>('/api/admin/content/payment-modes', data);
}

// Update existing payment mode
export async function updatePaymentMode(
  id: string,
  data: PaymentModePayload
): Promise<ApiResponse<PaymentMode>> {
  return apiClient.put<ApiResponse<PaymentMode>>(`/api/admin/content/payment-modes/${id}`, data);
}

// Delete payment mode
export async function deletePaymentMode(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/payment-modes/${id}`);
}
