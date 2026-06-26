import api from '@/shared/services/api';
import type { AuthResponse, User, LoginInput, RegisterInput } from '@/shared/types';

interface WrappedResponse<T> {
  data: T;
  meta: { timestamp: string };
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await api.post<never, WrappedResponse<AuthResponse>>('/auth/login', input);
    return res.data;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await api.post<never, WrappedResponse<AuthResponse>>('/auth/register', input);
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async refresh(): Promise<{ accessToken: string }> {
    const res = await api.post<never, WrappedResponse<{ accessToken: string }>>('/auth/refresh');
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<never, WrappedResponse<User>>('/auth/me');
    return res.data;
  },
};
