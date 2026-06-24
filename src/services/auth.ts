import type { OtpResponse, AuthResponse } from 'src/types/api';

import { apiClient, clearAuthData } from 'src/utils/api-client';

import { clearPlatformAuth } from 'src/services/platform-auth';

// Storage keys
const TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';

// Send OTP to mobile number
export async function sendOtp(mobile: string): Promise<OtpResponse> {
  return apiClient.post<OtpResponse>('/api/auth/send-otp', { mobile });
}

// Verify OTP and authenticate user
export async function verifyOtp(mobile: string, otp: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/auth/verify-otp', { mobile, otp });

  console.log('Full verify-otp response:', response);

  // Store token and user data in session storage
  if (response.success && response.data?.token) {
    console.log('Storing token and user data:', {
      tokenLength: response.data.token.length,
      userName: response.data.user.name,
    });
    sessionStorage.setItem(TOKEN_KEY, response.data.token);
    sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));

    // Verify storage
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    console.log('Token stored successfully:', !!storedToken);
    // NOTE: platform login is a SEPARATE identity (a PlatformAdmin, e.g.
    // 8108053373) from the tenant store-admin login here. The Tenants page pops
    // its own PlatformLoginDialog for that — we do NOT auto-mint it.
  } else {
    console.error('Token not found in response!', response);
  }

  return response;
}

// Logout user
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    // Continue with logout even if API call fails
    console.error('Logout API error:', error);
  } finally {
    // Clear auth data from storage (tenant + platform tokens)
    clearAuthData();
    clearPlatformAuth();
  }
}

// Get stored auth token
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Get stored user data
export function getUserData() {
  const userData = sessionStorage.getItem(USER_DATA_KEY);
  return userData ? JSON.parse(userData) : null;
}
