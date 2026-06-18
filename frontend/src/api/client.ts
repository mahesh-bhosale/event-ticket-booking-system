import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env['VITE_API_URL'] as string | undefined ?? 'http://localhost:5000/api/v1';
const ACCESS_TOKEN_KEY = 'sortmyscene_access_token';

// ─────────────────────────────────────────────────────────────
//  Token Helpers
// ─────────────────────────────────────────────────────────────
export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  remove(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};

// ─────────────────────────────────────────────────────────────
//  Axios Instance
// ─────────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
//  Request Interceptor — Attach JWT
// ─────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = tokenStorage.get();
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─────────────────────────────────────────────────────────────
//  Response Interceptor — Handle Errors and 401s
// ─────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      // Handle 401 Session Expiration
      if (status === 401) {
        // Clear active session states from localStorage
        tokenStorage.remove();
        localStorage.removeItem('sortmyscene_user');
        localStorage.removeItem('sortmyscene_refresh_token');
        sessionStorage.removeItem('sortmyscene_reservation');

        // Set session expiration toast redirect flag in sessionStorage
        sessionStorage.setItem('show_expired_toast', 'true');

        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          // Force redirect to login page
          window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      }

      // Convert server error payload to user-friendly text message and bind to error object
      error.message = getApiErrorMessage(error);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
