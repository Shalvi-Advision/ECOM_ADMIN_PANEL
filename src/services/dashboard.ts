import type {
  TopProduct,
  ApiResponse,
  RecentOrder,
  TopCategory,
  UserActivity,
  SalesTrendData,
  DashboardOverview,
  StatusDistribution,
} from 'src/types/api';

import { apiClient } from 'src/utils/api-client';

// Get dashboard overview statistics
export async function getDashboardOverview(): Promise<ApiResponse<DashboardOverview>> {
  return apiClient.get<ApiResponse<DashboardOverview>>('/api/admin/dashboard/overview');
}

// Get sales trend data
export async function getSalesTrend(days: number = 30): Promise<ApiResponse<SalesTrendData[]>> {
  return apiClient.get<ApiResponse<SalesTrendData[]>>(
    `/api/admin/dashboard/sales-trend?days=${days}`
  );
}

// Get top products
export async function getTopProducts(limit: number = 10): Promise<ApiResponse<TopProduct[]>> {
  return apiClient.get<ApiResponse<TopProduct[]>>(
    `/api/admin/dashboard/top-products?limit=${limit}`
  );
}

// Get top categories
export async function getTopCategories(limit: number = 10): Promise<ApiResponse<TopCategory[]>> {
  return apiClient.get<ApiResponse<TopCategory[]>>(
    `/api/admin/dashboard/top-categories?limit=${limit}`
  );
}

// Get recent orders
export async function getRecentOrders(limit: number = 10): Promise<ApiResponse<RecentOrder[]>> {
  return apiClient.get<ApiResponse<RecentOrder[]>>(
    `/api/admin/dashboard/recent-orders?limit=${limit}`
  );
}

// Get order status distribution
export async function getOrderStatusDistribution(): Promise<
  ApiResponse<StatusDistribution[]>
> {
  return apiClient.get<ApiResponse<StatusDistribution[]>>(
    '/api/admin/dashboard/order-status-distribution'
  );
}

// Get payment status distribution
export async function getPaymentStatusDistribution(): Promise<
  ApiResponse<StatusDistribution[]>
> {
  return apiClient.get<ApiResponse<StatusDistribution[]>>(
    '/api/admin/dashboard/payment-status-distribution'
  );
}

// Get user activity stats
export async function getUserActivity(): Promise<ApiResponse<UserActivity>> {
  return apiClient.get<ApiResponse<UserActivity>>('/api/admin/dashboard/user-activity');
}
