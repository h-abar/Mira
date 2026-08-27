import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

export const TOKEN_KEY = 'token';
export const TENANT_KEY = 'tenant';

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Resolves the current workspace slug:
 * 1. Explicitly stored (set by the login screen when no subdomain is used).
 * 2. Subdomain of the host (salon-slug.example.com -> salon-slug).
 * Reserved names are ignored so the platform itself uses the default workspace.
 */
export function resolveTenantSlug(): string | null {
  const stored = localStorage.getItem(TENANT_KEY);
  if (stored) return stored;

  const host = window.location.hostname.toLowerCase();
  const parts = host.split('.');
  const reserved = new Set(['www', 'api', 'admin', 'app', 'localhost', '127', '0']);
  if (parts.length > 2 && !reserved.has(parts[0]) && parts[0] !== '') {
    return parts[0];
  }
  return null;
}

const normalizeError = (error: AxiosError): ApiError => {
  const data = error.response?.data as { message?: string } | undefined;
  const message =
    data?.message || (typeof error.message === 'string' ? error.message : 'Request failed');
  return {
    message,
    status: error.response?.status,
  };
};

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenant = resolveTenantSlug();
  if (tenant) {
    config.headers['X-Tenant'] = tenant;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(normalizeError(error));
  },
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    client.get<T>(url, config).then((response) => response.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    client.post<T>(url, data, config).then((response) => response.data),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    client.put<T>(url, data, config).then((response) => response.data),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    client.patch<T>(url, data, config).then((response) => response.data),
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    client.delete<T>(url, config).then((response) => response.data),
};

export default client;