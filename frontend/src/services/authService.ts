import axios, { AxiosInstance } from 'axios';
import {
  UserDto,
  LoginResponseDto,
  TokenValidationResponseDto,
  SetupStatusDto,
} from '../types/user';

const API_BASE_URL = '/api/auth';
export const AUTH_TOKEN_KEY = 'auth_token';

// Create axios instance with interceptors
export const createAuthApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to attach Authorization header
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - clear local storage
        localStorage.removeItem(AUTH_TOKEN_KEY);
        // Optionally redirect to login - handled by AuthContext
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createAuthApiInstance();

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponseDto> => {
    const response = await api.post<LoginResponseDto>('/login', {
      username,
      password,
    });
    // Store token in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/logout');
    } finally {
      // Always remove token, even if logout endpoint fails
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  getMe: async (): Promise<UserDto | null> => {
    try {
      const response = await api.get<UserDto>('/me');
      return response.data;
    } catch (error: unknown) {
      // Return null if not authenticated
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 401
      ) {
        return null;
      }
      throw error;
    }
  },

  isSetupRequired: async (): Promise<SetupStatusDto> => {
    const response = await api.get<SetupStatusDto>('/setup-required');
    return response.data;
  },

  setupAdmin: async (password: string): Promise<void> => {
    await api.post('/setup-admin', { password });
  },

  setPassword: async (token: string, password: string): Promise<void> => {
    await api.post(`/set-password/${token}`, { password });
  },

  validateToken: async (token: string): Promise<TokenValidationResponseDto> => {
    const response = await api.get<TokenValidationResponseDto>(`/validate-token/${token}`);
    return response.data;
  },

  getToken: (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
  },
};
