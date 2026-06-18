import type { Tenant, ApiResponse, TenantListResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

import { platformAuthHeader } from 'src/services/platform-auth';

// Control-plane tenant management (plan §8 / Phase 5 + 7). These hit the platform
// routes mounted BEFORE resolveTenant on the API; they require a platform
// super-admin token (sent via platformAuthHeader, overriding the tenant token).

// Provisioning job shape returned by GET /:slug/job.
export interface ProvisioningStep {
  key: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'rolledback';
  error?: string | null;
}
export interface ProvisioningJob {
  tenantSlug: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'rolledback';
  steps: ProvisioningStep[];
  error?: string | null;
}

// The wizard payload for POST /api/admin/tenants.
export interface ProvisionTenantInput {
  name: string;
  slug: string;
  subdomain: string;
  customDomain?: string;
  branding?: Record<string, string>;
  integrations?: {
    razorpay?: { keyId: string; keySecret: string };
    sms?: { baseUrl: string; userId: string; password: string; senderId?: string; clientName?: string };
  };
  adminUser: { name?: string; mobile: string };
  catalog?: { template?: string; storeCode?: string };
}

function ctl(): { headers: Record<string, string> } {
  return { headers: platformAuthHeader() };
}

// List all tenants (no secrets returned).
export async function getTenants(): Promise<TenantListResponse> {
  return apiClient.get<TenantListResponse>('/api/admin/tenants', ctl());
}

// Available catalog seed templates (for the wizard's Catalog step).
export async function getCatalogTemplates(): Promise<ApiResponse<string[]>> {
  return apiClient.get<ApiResponse<string[]>>('/api/admin/tenants/catalog-templates', ctl());
}

// Provision a new tenant (transactional). Returns slug/status/jobId.
export async function provisionTenant(
  input: ProvisionTenantInput
): Promise<ApiResponse<{ slug: string; status: string; jobId: string }>> {
  return apiClient.post<ApiResponse<{ slug: string; status: string; jobId: string }>>(
    '/api/admin/tenants',
    input,
    ctl()
  );
}

// Latest provisioning job for a tenant (step-by-step status).
export async function getProvisioningJob(slug: string): Promise<ApiResponse<ProvisioningJob>> {
  return apiClient.get<ApiResponse<ProvisioningJob>>(`/api/admin/tenants/${slug}/job`, ctl());
}

// Suspend a tenant (status -> suspended; stops resolving immediately).
export async function suspendTenant(
  slug: string
): Promise<ApiResponse<Pick<Tenant, 'slug' | 'status'>>> {
  return apiClient.patch<ApiResponse<Pick<Tenant, 'slug' | 'status'>>>(
    `/api/admin/tenants/${slug}/suspend`,
    undefined,
    ctl()
  );
}

// Resume a suspended tenant (status -> active).
export async function resumeTenant(
  slug: string
): Promise<ApiResponse<Pick<Tenant, 'slug' | 'status'>>> {
  return apiClient.patch<ApiResponse<Pick<Tenant, 'slug' | 'status'>>>(
    `/api/admin/tenants/${slug}/resume`,
    undefined,
    ctl()
  );
}

// Delete a tenant (drops its DB, marks deleted).
export async function deleteTenant(
  slug: string
): Promise<ApiResponse<{ slug: string; status: string }>> {
  return apiClient.delete<ApiResponse<{ slug: string; status: string }>>(
    `/api/admin/tenants/${slug}`,
    ctl()
  );
}

// ---- Custom domain lifecycle (plan §10.4): pending -> approved -> live -------

export interface DomainResult {
  customDomain: string;
  domainStatus: 'none' | 'pending' | 'approved' | 'live' | 'failed';
  cname?: { host: string; target: string };
  instructions?: string;
}

// Register/replace a tenant's custom domain -> pending. Returns CNAME to show.
export async function setTenantDomain(
  slug: string,
  customDomain: string
): Promise<ApiResponse<DomainResult>> {
  return apiClient.patch<ApiResponse<DomainResult>>(
    `/api/admin/tenants/${slug}/domain`,
    { customDomain },
    ctl()
  );
}

// Approve a pending domain (DNS confirmed) -> approved (cert issues on first hit).
export async function approveTenantDomain(slug: string): Promise<ApiResponse<DomainResult>> {
  return apiClient.patch<ApiResponse<DomainResult>>(
    `/api/admin/tenants/${slug}/domain/approve`,
    undefined,
    ctl()
  );
}

// Flip approved -> live once the cert is confirmed serving.
export async function markTenantDomainLive(slug: string): Promise<ApiResponse<DomainResult>> {
  return apiClient.patch<ApiResponse<DomainResult>>(
    `/api/admin/tenants/${slug}/domain/mark-live`,
    undefined,
    ctl()
  );
}
