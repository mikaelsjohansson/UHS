import axios, { AxiosInstance } from 'axios';
import { Expense } from '../types/expense';

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
};

