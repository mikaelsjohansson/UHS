import axios, { AxiosInstance } from 'axios';
import {
  UserDto,
  CreateUserRequestDto,
  CreateUserResponseDto,
  UpdateUserRequestDto,
} from '../types/user';
import { AUTH_TOKEN_KEY } from './authService';

const API_BASE_URL = '/api/users';

// Create axios instance with auth interceptor
export const createUserApiInstance = (): AxiosInstance => {
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
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createUserApiInstance();

export const userService = {
  getAll: async (): Promise<UserDto[]> => {
    const response = await api.get<UserDto[]>('');
    return response.data;
  },

  getById: async (id: number): Promise<UserDto> => {
    const response = await api.get<UserDto>(`/${id}`);
    return response.data;
  },

  create: async (request: CreateUserRequestDto): Promise<CreateUserResponseDto> => {
    const response = await api.post<CreateUserResponseDto>('', request);
    return response.data;
  },

  update: async (id: number, request: UpdateUserRequestDto): Promise<UserDto> => {
    const response = await api.put<UserDto>(`/${id}`, request);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/${id}`);
  },

  generateToken: async (id: number): Promise<{ setupUrl: string }> => {
    const response = await api.post<{ setupUrl: string }>(`/${id}/generate-token`);
    return response.data;
  },
};
