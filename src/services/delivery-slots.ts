import type {
  ApiResponse,
  DeliverySlot,
  PaginatedResponse,
  DeliverySlotPayload,
  DeliverySlotsQueryParams,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all delivery slots with pagination and sorting
export async function getAllDeliverySlots(
  params: DeliverySlotsQueryParams = {}
): Promise<PaginatedResponse<DeliverySlot>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/content/delivery-slots${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<DeliverySlot>>(endpoint);
}

// Get single delivery slot by ID
export async function getDeliverySlotById(id: string): Promise<ApiResponse<DeliverySlot>> {
  return apiClient.get<ApiResponse<DeliverySlot>>(`/api/admin/content/delivery-slots/${id}`);
}

// Create new delivery slot
export async function createDeliverySlot(
  data: DeliverySlotPayload
): Promise<ApiResponse<DeliverySlot>> {
  return apiClient.post<ApiResponse<DeliverySlot>>('/api/admin/content/delivery-slots', data);
}

// Update existing delivery slot
export async function updateDeliverySlot(
  id: string,
  data: DeliverySlotPayload
): Promise<ApiResponse<DeliverySlot>> {
  return apiClient.put<ApiResponse<DeliverySlot>>(
    `/api/admin/content/delivery-slots/${id}`,
    data
  );
}

// Delete delivery slot
export async function deleteDeliverySlot(id: string): Promise<ApiResponse<null>> {
  return apiClient.delete<ApiResponse<null>>(`/api/admin/content/delivery-slots/${id}`);
}
