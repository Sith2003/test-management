import api from '@/shared/services/api';
import type { AppNotification } from '@/shared/types';

export const notificationService = {
  async getAll(): Promise<AppNotification[]> {
    const res = await api.get<never, { data: AppNotification[] }>('/notifications');
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get<never, { data: { count: number } }>('/notifications/unread-count');
    return res.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async deleteOne(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
