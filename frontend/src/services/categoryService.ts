import axios, { AxiosInstance } from 'axios';
import { Category } from '../types/category';

const API_BASE_URL = '/api/categories';
const AUTH_TOKEN_KEY = 'auth_token';

// Create axios instance - can be mocked in tests
export const createCategoryApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add JWT token to requests
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 401 errors by clearing token
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

const api = createCategoryApiInstance();

export const categoryService = {
  getAllCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('');
    return response.data;
  },

  getCategoryById: async (id: number): Promise<Category> => {
    const response = await api.get<Category>(`/${id}`);
    return response.data;
  },

  createCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const response = await api.post<Category>('', category);
    return response.data;
  },

  updateCategory: async (id: number, category: Omit<Category, 'id'>): Promise<Category> => {
    const response = await api.put<Category>(`/${id}`, category);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/${id}`);
  },
};


