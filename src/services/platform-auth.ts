import type { OtpResponse } from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Platform super-admin auth (multi-tenant Phase 7). Distinct from the tenant
// store-admin login in services/auth.ts: platform admins authenticate against the
// control plane (/api/admin/platform) and receive a token carrying the
// `platformAdmin` claim. That token gates control routes (tenant list/suspend/
// resume/provision). We store it SEPARATELY from the tenant authToken so a user
// can hold both (a tenant admin who is also a platform admin).

const PLATFORM_TOKEN_KEY = 'platformToken';
const PLATFORM_ADMIN_KEY = 'platformAdmin';

export interface PlatformAdmin {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  allowedTenantSlugs: string[];
}

interface PlatformVerifyResponse {
  success: boolean;
  message?: string;
  data?: { token: string; admin: PlatformAdmin };
}

export async function platformSendOtp(mobile: string): Promise<OtpResponse> {
  return apiClient.post<OtpResponse>('/api/admin/platform/send-otp', { mobile });
}

export async function platformVerifyOtp(
  mobile: string,
  otp: string
): Promise<PlatformVerifyResponse> {
  const response = await apiClient.post<PlatformVerifyResponse>(
    '/api/admin/platform/verify-otp',
    { mobile, otp }
  );
  if (response.success && response.data?.token) {
    sessionStorage.setItem(PLATFORM_TOKEN_KEY, response.data.token);
    sessionStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify(response.data.admin));
  }
  return response;
}

export function getPlatformToken(): string | null {
  return sessionStorage.getItem(PLATFORM_TOKEN_KEY);
}

export function getPlatformAdmin(): PlatformAdmin | null {
  const raw = sessionStorage.getItem(PLATFORM_ADMIN_KEY);
  return raw ? (JSON.parse(raw) as PlatformAdmin) : null;
}

export function isPlatformAuthenticated(): boolean {
  return !!getPlatformToken();
}

export function clearPlatformAuth(): void {
  sessionStorage.removeItem(PLATFORM_TOKEN_KEY);
  sessionStorage.removeItem(PLATFORM_ADMIN_KEY);
}

// Authorization header object for control-plane calls (overrides the tenant
// Bearer token in api-client). Empty when no platform session exists.
export function platformAuthHeader(): Record<string, string> {
  const token = getPlatformToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
