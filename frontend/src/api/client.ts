import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

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
//  Response Interceptor — Handle 401 Unauthorized
// ─────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      // Clear stale token
      tokenStorage.remove();
      // Redirect to login (avoid circular imports — use window directly)
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
