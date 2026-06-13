import axios from 'axios';
import type { ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function request<T = any>(url: string, options: any = {}): Promise<ApiResponse<T>> {
  try {
    const response = await api(url, options);
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || '请求失败',
    };
  }
}

export const authApi = {
  login: (data: { phone?: string; email?: string; password: string }) =>
    request('/auth/login', { method: 'POST', data }),
  register: (data: { phone: string; email: string; nickname: string; password: string; neighborhood: string }) =>
    request('/auth/register', { method: 'POST', data }),
  getProfile: () => request('/auth/profile'),
};

export const itemApi = {
  getItems: (params?: { category?: string; keyword?: string }) =>
    request('/items', { params }),
  getItemById: (id: string) => request(`/items/${id}`),
  getMyItems: () => request('/items/my'),
  createItem: (data: any) => request('/items', { method: 'POST', data }),
  updateItem: (id: string, data: any) =>
    request(`/items/${id}`, { method: 'PUT', data }),
};

export const skillApi = {
  getSkills: (params?: { category?: string; keyword?: string }) =>
    request('/skills', { params }),
  getSkillById: (id: string) => request(`/skills/${id}`),
  getMySkills: () => request('/skills/my'),
  createSkill: (data: any) => request('/skills', { method: 'POST', data }),
  updateSkill: (id: string, data: any) =>
    request(`/skills/${id}`, { method: 'PUT', data }),
};

export const orderApi = {
  getBorrowOrders: (role?: string) =>
    request('/orders/borrow', { params: { role } }),
  getBorrowOrderById: (id: string) => request(`/orders/borrow/${id}`),
  createBorrowOrder: (data: any) =>
    request('/orders/borrow', { method: 'POST', data }),
  approveBorrowOrder: (id: string) =>
    request(`/orders/borrow/${id}/approve`, { method: 'PUT' }),
  rejectBorrowOrder: (id: string, reason?: string) =>
    request(`/orders/borrow/${id}/reject`, { method: 'PUT', data: { reason } }),
  confirmLend: (id: string) =>
    request(`/orders/borrow/${id}/lend`, { method: 'PUT' }),
  confirmReturn: (id: string) =>
    request(`/orders/borrow/${id}/return`, { method: 'PUT' }),
  confirmReturnWithDamage: (id: string, data: { description: string; photos: string[] }) =>
    request(`/orders/borrow/${id}/return-damage`, { method: 'PUT', data }),

  getServiceOrders: (role?: string) =>
    request('/orders/service', { params: { role } }),
  getServiceOrderById: (id: string) => request(`/orders/service/${id}`),
  createServiceOrder: (data: any) =>
    request('/orders/service', { method: 'POST', data }),
  approveServiceOrder: (id: string) =>
    request(`/orders/service/${id}/approve`, { method: 'PUT' }),
  rejectServiceOrder: (id: string, reason?: string) =>
    request(`/orders/service/${id}/reject`, { method: 'PUT', data: { reason } }),
  startService: (id: string) =>
    request(`/orders/service/${id}/start`, { method: 'PUT' }),
  completeService: (id: string) =>
    request(`/orders/service/${id}/complete`, { method: 'PUT' }),
};

export const reviewApi = {
  getReviewsByUser: (userId: string) => request(`/reviews/user/${userId}`),
  getReviewsByOrder: (orderId: string, orderType: string) =>
    request('/reviews/order', { params: { orderId, orderType } }),
  createReview: (data: any) => request('/reviews', { method: 'POST', data }),
};

export const disputeApi = {
  getDisputes: (role?: string) =>
    request('/disputes', { params: { role } }),
  getAllDisputes: (status?: string) =>
    request('/disputes/all', { params: { status } }),
  getDisputeById: (id: string) => request(`/disputes/${id}`),
  createDispute: (data: any) =>
    request('/disputes', { method: 'POST', data }),
  startReview: (id: string) =>
    request(`/disputes/${id}/review`, { method: 'PUT' }),
  resolveDispute: (id: string, data: any) =>
    request(`/disputes/${id}/resolve`, { method: 'PUT', data }),
  makeOffer: (id: string, data: { amount: number; message?: string }) =>
    request(`/disputes/${id}/offer`, { method: 'PUT', data }),
  acceptOffer: (id: string, data: { amount: number }) =>
    request(`/disputes/${id}/accept`, { method: 'PUT', data }),
  sendMessage: (id: string, data: { content: string; amount?: number }) =>
    request(`/disputes/${id}/message`, { method: 'PUT', data }),
  escalateDispute: (id: string, data?: { reason?: string }) =>
    request(`/disputes/${id}/escalate`, { method: 'PUT', data }),
};

export const queueApi = {
  joinQueue: (data: { itemId: string; message?: string }) =>
    request('/queue', { method: 'POST', data }),
  cancelQueue: (id: string) =>
    request(`/queue/${id}`, { method: 'DELETE' }),
  getMyQueues: () => request('/queue/my'),
  getItemQueues: (itemId: string) => request(`/queue/item/${itemId}`),
  getQueueById: (id: string) => request(`/queue/${id}`),
  confirmQueueBorrow: (id: string, data: { startDate: string; endDate: string; message?: string }) =>
    request(`/queue/${id}/confirm`, { method: 'PUT', data }),
  getNotifications: () => request('/queue/notifications/list'),
  getUnreadNotificationCount: () => request('/queue/notifications/unread-count'),
  markNotificationAsRead: (id: string) =>
    request(`/queue/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsAsRead: () =>
    request('/queue/notifications/read-all', { method: 'PUT' }),
};

export const notificationApi = {
  getNotifications: () => request('/notifications/list'),
  getUnreadCount: () => request('/notifications/unread-count'),
  markAsRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id: string) =>
    request(`/notifications/${id}`, { method: 'DELETE' }),
  deleteMany: (ids: string[]) =>
    request('/notifications/batch', { method: 'DELETE', data: { ids } }),
};

export default api;
