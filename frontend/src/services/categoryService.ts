import axios, { AxiosInstance } from 'axios';
import { Category } from '../types/category';

const API_BASE_URL = '/api/categories';

// Create axios instance - can be mocked in tests
export const createCategoryApiInstance = (): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
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

