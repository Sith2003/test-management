import axios, { type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/shared/stores/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor - add auth header
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token refresh queue
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Response interceptor - return raw response body, handle 401 with auto-refresh
// Services are responsible for unwrapping { data, meta } or { data, pagination, meta }
api.interceptors.response.use(
  (response) => {
    // Return the raw response body - services handle unwrapping
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<{ data: { accessToken: string } }>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data.data;
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth(currentUser, accessToken);
        }
        onRefreshed(accessToken);
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
