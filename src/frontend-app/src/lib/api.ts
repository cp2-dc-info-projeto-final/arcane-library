
import axios, {
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';

import { removeToken } from './auth';

export interface ApiFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data?: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors: ApiFieldError[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;


// Instância global do Axios
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar automaticamente o token Bearer
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('auth_token');

      if (token) {
        config.headers.set(
          'Authorization',
          `Bearer ${token}`
        );
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      removeToken();

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
