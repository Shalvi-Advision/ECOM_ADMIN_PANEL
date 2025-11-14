import type { User, UsersQueryParams, PaginatedResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get all users with pagination, search, filtering, and sorting
export async function getAllUsers(
  params: UsersQueryParams = {}
): Promise<PaginatedResponse<User>> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.role) queryParams.append('role', params.role);
  if (params.sort) queryParams.append('sort', params.sort);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<PaginatedResponse<User>>(endpoint);
}
