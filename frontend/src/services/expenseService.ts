import axios, { AxiosInstance } from 'axios';
import { Expense } from '../types/expense';
import { CategoryExpenseSummary, CategoryTrend } from '../types/analytics';

const API_BASE_URL = '/api/expenses';

// Create axios instance - can be mocked in tests
export const createApiInstance = (): AxiosInstance => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const api = createApiInstance();

export const expenseService = {
  getAllExpenses: async (): Promise<Expense[]> => {
    const response = await api.get<Expense[]>('');
    return response.data;
  },

  getExpenseById: async (id: number): Promise<Expense> => {
    const response = await api.get<Expense>(`/${id}`);
    return response.data;
  },

  createExpense: async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
    const response = await api.post<Expense>('', expense);
    return response.data;
  },

  updateExpense: async (id: number, expense: Omit<Expense, 'id'>): Promise<Expense> => {
    const response = await api.put<Expense>(`/${id}`, expense);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`/${id}`);
  },

  getExpensesByYearMonth: async (year: number, month: number): Promise<CategoryExpenseSummary[]> => {
    const response = await api.get<CategoryExpenseSummary[]>('/analytics', {
      params: { year, month },
    });
    return response.data;
  },

  getCategoryTrend: async (
    category: string,
    startDate: string,
    endDate: string
  ): Promise<CategoryTrend[]> => {
    const response = await api.get<CategoryTrend[]>(`/analytics/category/${encodeURIComponent(category)}`, {
      params: {
        startDate,
        endDate,
      },
    });
    return response.data;
  },

  getDescriptionSuggestions: async (query: string): Promise<string[]> => {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const response = await api.get<string[]>('/suggestions', {
      params: { query: query.trim() },
    });
    return response.data;
  },

  getCategoryHint: async (description: string): Promise<string | null> => {
    if (!description || description.trim().length === 0) {
      return null;
    }
    try {
      const response = await api.get<string>('/category-hint', {
        params: { description: description.trim() },
      });
      return response.data;
    } catch (error: any) {
      // If 204 No Content, return null
      if (error.response?.status === 204) {
        return null;
      }
      throw error;
    }
  },

  getExpensesByMonth: async (year: number, month: number): Promise<Expense[]> => {
    const response = await api.get<Expense[]>('/month', {
      params: { year, month },
    });
    return response.data;
  },
};

