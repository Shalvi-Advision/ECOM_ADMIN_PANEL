// API Client utility for making HTTP requests

import { getSelectedTenant } from 'src/contexts/tenant-context';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5008';

// Get auth token from session storage
const getAuthToken = (): string | null => sessionStorage.getItem('authToken');

// Clear auth data on logout or token expiry
export const clearAuthData = () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
};

// Handle API errors
class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers
  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Add the tenant store-admin token ONLY if the caller didn't already supply an
  // Authorization header. Control-plane calls (platform panel) pass their own
  // platform Bearer token via options.headers; the tenant token must NOT clobber
  // it, or /api/admin/tenants gets a token with no platformAdmin claim (403).
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // When a super-admin has selected a tenant to act on, send it as X-Tenant so
  // the backend scopes business requests to that tenant. Store-admins never set
  // a selection, so this is absent and their tenant is resolved from the JWT/Host.
  // Control-plane routes (/api/admin/platform, /api/admin/tenants) ignore it.
  const selectedTenant = getSelectedTenant();
  if (selectedTenant && !headers['X-Tenant']) {
    headers['X-Tenant'] = selectedTenant;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Parse response
    const data = await response.json();

    // Handle 401 Unauthorized. We auto-logout ONLY for the session-validating
    // calls (the auth profile/whoami). A 401 from a background widget — e.g. the
    // header notifications poller — must NOT hard-redirect you off the page you're
    // on (that bounced users off /tenants). It also must skip the login endpoints
    // (auth/platform), whose 401s are results the caller handles itself.
    const isAuthEndpoint =
      endpoint.startsWith('/api/auth/') || endpoint.startsWith('/api/admin/platform/');
    // Only these endpoints prove the session is dead enough to force re-login.
    const isSessionCritical = endpoint.startsWith('/api/auth/profile');
    const alreadyOnSignIn =
      typeof window !== 'undefined' &&
      (window.location.pathname === '/sign-in' || window.location.pathname === '/');

    if (response.status === 401 && isSessionCritical && !isAuthEndpoint && !alreadyOnSignIn) {
      clearAuthData();
      window.location.href = '/sign-in';
      throw new ApiError(401, 'Unauthorized - Please sign in again');
    }

    // Check response body's success field first (for backends that return wrong status codes)
    // If success field exists and is false, treat as error
    if (data.success === false) {
      throw new ApiError(
        response.status,
        data.message || 'An error occurred',
        data
      );
    }

    // If success field is true or doesn't exist, check HTTP status
    // Only throw error if both conditions fail
    if (!response.ok && data.success !== true) {
      throw new ApiError(
        response.status,
        data.message || 'An error occurred',
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors
    throw new ApiError(0, 'Network error - Please check your connection');
  }
}

// API client methods
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit): Promise<T> =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiError };
