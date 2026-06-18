import type { Tenant, ApiResponse, TenantListResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Control-plane tenant management (plan §8 / Phase 5). These hit the platform
// routes mounted BEFORE resolveTenant on the API; they require a platform
// super-admin token and never carry a tenant context.

// List all tenants (no secrets returned).
export async function getTenants(): Promise<TenantListResponse> {
  return apiClient.get<TenantListResponse>('/api/admin/tenants');
}

// Suspend a tenant (status -> suspended; stops resolving immediately).
export async function suspendTenant(
  slug: string
): Promise<ApiResponse<Pick<Tenant, 'slug' | 'status'>>> {
  return apiClient.patch<ApiResponse<Pick<Tenant, 'slug' | 'status'>>>(
    `/api/admin/tenants/${slug}/suspend`
  );
}

// Resume a suspended tenant (status -> active).
export async function resumeTenant(
  slug: string
): Promise<ApiResponse<Pick<Tenant, 'slug' | 'status'>>> {
  return apiClient.patch<ApiResponse<Pick<Tenant, 'slug' | 'status'>>>(
    `/api/admin/tenants/${slug}/resume`
  );
}
