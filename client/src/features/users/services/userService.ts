import api from '@/shared/services/api';
import type { User, CollectionResponse, Pagination, UserRole } from '@/shared/types';

interface Wrapped<T> { data: T; meta: { timestamp: string }; }
interface PaginatedResponse<T> { data: T[]; pagination: Pagination; meta: { timestamp: string }; }

export interface UpdateUserInput { role?: string; isActive?: boolean; }
export interface CreateUserInput { email: string; name: string; password: string; role?: UserRole; }

export const userService = {
  async getUsers(params?: Record<string, string>): Promise<CollectionResponse<User>> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<never, PaginatedResponse<User>>(`/users${query}`);
  },

  async createUser(input: CreateUserInput): Promise<User> {
    const res = await api.post<never, Wrapped<User>>('/users', input);
    return res.data;
  },

  async updateUser(userId: string, input: UpdateUserInput): Promise<User> {
    const res = await api.patch<never, Wrapped<User>>(`/users/${userId}`, input);
    return res.data;
  },

  async resetPassword(userId: string, newPassword: string): Promise<User> {
    const res = await api.patch<never, Wrapped<User>>(`/users/${userId}/password`, { newPassword });
    return res.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`);
  },
};
