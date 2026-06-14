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
  searchItems: (params?: {
    category?: string;
    keyword?: string;
    minDeposit?: number;
    maxDeposit?: number;
    minCreditLevel?: string;
    userNeighborhood?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
  }) => request('/items/search', { params }),
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
  getSchedules: (skillId: string) => request(`/skills/${skillId}/schedules`),
  getAvailableSlots: (skillId: string, date?: string) =>
    request(`/skills/${skillId}/available-slots`, { params: date ? { date } : {} }),
  setSchedule: (skillId: string, data: { date: string; timeSlots: { startTime: string; endTime: string }[] }) =>
    request(`/skills/${skillId}/schedule`, { method: 'POST', data }),
  batchSetSchedule: (skillId: string, data: { schedules: { date: string; timeSlots: { startTime: string; endTime: string }[] }[] }) =>
    request(`/skills/${skillId}/schedules/batch`, { method: 'POST', data }),
  checkConflict: (skillId: string, date: string, startTime: string, endTime: string) =>
    request(`/skills/${skillId}/check-conflict`, { params: { date, startTime, endTime } }),
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
  getMyPostedReviews: () => request('/reviews/my-posted'),
  getReviewsByOrder: (orderId: string, orderType: string) =>
    request('/reviews/order', { params: { orderId, orderType } }),
  getReviewReplies: (reviewId: string) => request(`/reviews/${reviewId}/replies`),
  createReview: (data: any) => request('/reviews', { method: 'POST', data }),
  createReviewReply: (reviewId: string, content: string) =>
    request(`/reviews/${reviewId}/replies`, { method: 'POST', data: { content } }),
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

export const neighborhoodApi = {
  getMembers: () => request('/neighborhood/members'),
  getItems: (params?: { category?: string; keyword?: string }) =>
    request('/neighborhood/items', { params }),
  getSkills: (params?: { category?: string; keyword?: string }) =>
    request('/neighborhood/skills', { params }),
  getStats: () => request('/neighborhood/stats'),
};

export const transactionApi = {
  getDepositTransactions: (type?: string) =>
    request('/transactions/deposit', { params: type ? { type } : {} }),
  getTimeCoinTransactions: (type?: string) =>
    request('/transactions/time-coin', { params: type ? { type } : {} }),
};

export const statsApi = {
  getDashboardStats: () => request('/stats/dashboard'),
};

export const favoriteApi = {
  getFavorites: () => request('/favorites/list'),
  checkFavorite: (itemId: string) => request('/favorites/check/' + itemId),
  toggleFavorite: (itemId: string) => request('/favorites/toggle/' + itemId, { method: 'POST' }),
  addFavorite: (itemId: string) => request('/favorites/' + itemId, { method: 'POST' }),
  removeFavorite: (itemId: string) => request('/favorites/' + itemId, { method: 'DELETE' }),
  getItemFavoriteCount: (itemId: string) => request('/favorites/count/' + itemId),
};

export const followApi = {
  getFollowing: () => request('/follows/following'),
  getFollowers: () => request('/follows/followers'),
  checkFollow: (userId: string) => request('/follows/check/' + userId),
  toggleFollow: (userId: string) => request('/follows/toggle/' + userId, { method: 'POST' }),
  followUser: (userId: string) => request('/follows/' + userId, { method: 'POST' }),
  unfollowUser: (userId: string) => request('/follows/' + userId, { method: 'DELETE' }),
  getFollowStats: (userId: string) => request('/follows/stats/' + userId),
  getFollowingLatestSkills: () => request('/follows/latest-skills'),
};

export const exchangeApi = {
  getExchangeItems: (params?: { category?: string; keyword?: string }) =>
    request('/exchange/items', { params }),
  getExchangeItemById: (id: string) => request(`/exchange/items/${id}`),
  exchangeItem: (data: { itemId: string; quantity?: number; remark?: string }) =>
    request('/exchange/exchange', { method: 'POST', data }),
  getMyExchangeRecords: () => request('/exchange/records/my'),
  getExchangeRecordDetail: (id: string) => request(`/exchange/records/${id}`),
  cancelExchange: (id: string) =>
    request(`/exchange/records/${id}/cancel`, { method: 'PUT' }),
  getAllExchangeItems: () => request('/exchange/admin/items'),
  createExchangeItem: (data: any) =>
    request('/exchange/admin/items', { method: 'POST', data }),
  updateExchangeItem: (id: string, data: any) =>
    request(`/exchange/admin/items/${id}`, { method: 'PUT', data }),
  deleteExchangeItem: (id: string) =>
    request(`/exchange/admin/items/${id}`, { method: 'DELETE' }),
  restockItem: (id: string, quantity: number) =>
    request(`/exchange/admin/items/${id}/restock`, { method: 'PUT', data: { quantity } }),
  getAllExchangeRecords: () => request('/exchange/admin/records'),
  completeExchange: (id: string) =>
    request(`/exchange/admin/records/${id}/complete`, { method: 'PUT' }),
  getExchangeStats: () => request('/exchange/admin/stats'),
};

export default api;
