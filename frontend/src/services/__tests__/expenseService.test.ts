import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Expense } from '../../types/expense';
import { MultiCategoryTrend } from '../../types/analytics';

// Create mocks using vi.hoisted to ensure they're available before module import
const { mockGet, mockPost, mockPut, mockDelete, mockApiInstance } = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();
  const put = vi.fn();
  const del = vi.fn();
  
  return {
    mockGet: get,
    mockPost: post,
    mockPut: put,
    mockDelete: del,
    mockApiInstance: {
      get,
      post,
      put,
      delete: del,
    },
  };
});

// Mock axios before importing the service
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockApiInstance),
  },
}));

// Import after mocking
import { expenseService } from '../expenseService';

describe('expenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllExpenses', () => {
    it('should fetch all expenses', async () => {
      const mockExpenses: Expense[] = [
        { id: 1, description: 'Expense 1', amount: 100, expenseDate: '2024-01-15', category: 'Food' },
        { id: 2, description: 'Expense 2', amount: 200, expenseDate: '2024-01-16', category: 'Transport' },
      ];

      mockGet.mockResolvedValue({ data: mockExpenses });

      const result = await expenseService.getAllExpenses();

      expect(result).toEqual(mockExpenses);
      expect(mockGet).toHaveBeenCalledWith('');
    });
  });

  describe('getExpenseById', () => {
    it('should fetch a single expense by id', async () => {
      const mockExpense: Expense = {
        id: 1,
        description: 'Test Expense',
        amount: 100,
        expenseDate: '2024-01-15',
        category: 'Food',
      };

      mockGet.mockResolvedValue({ data: mockExpense });

      const result = await expenseService.getExpenseById(1);

      expect(result).toEqual(mockExpense);
      expect(mockGet).toHaveBeenCalledWith('/1');
    });
  });

  describe('createExpense', () => {
    it('should create a new expense', async () => {
      const newExpense: Omit<Expense, 'id'> = {
        description: 'New Expense',
        amount: 150,
        expenseDate: '2024-01-15',
        category: 'Food',
      };

      const createdExpense: Expense = { id: 1, ...newExpense };

      mockPost.mockResolvedValue({ data: createdExpense });

      const result = await expenseService.createExpense(newExpense);

      expect(result).toEqual(createdExpense);
      expect(mockPost).toHaveBeenCalledWith('', newExpense);
    });
  });

  describe('updateExpense', () => {
    it('should update an existing expense', async () => {
      const updatedExpense: Omit<Expense, 'id'> = {
        description: 'Updated Expense',
        amount: 200,
        expenseDate: '2024-01-15',
        category: 'Transport',
      };

      const resultExpense: Expense = { id: 1, ...updatedExpense };

      mockPut.mockResolvedValue({ data: resultExpense });

      const result = await expenseService.updateExpense(1, updatedExpense);

      expect(result).toEqual(resultExpense);
      expect(mockPut).toHaveBeenCalledWith('/1', updatedExpense);
    });
  });

  describe('deleteExpense', () => {
    it('should delete an expense', async () => {
      mockDelete.mockResolvedValue({});

      await expenseService.deleteExpense(1);

      expect(mockDelete).toHaveBeenCalledWith('/1');
    });
  });

  describe('getExpensesByMonth', () => {
    it('should fetch expenses for a specific month', async () => {
      const mockExpenses: Expense[] = [
        { id: 1, description: 'Expense 1', amount: 100, expenseDate: '2024-01-15', category: 'Food' },
        { id: 2, description: 'Expense 2', amount: 200, expenseDate: '2024-01-20', category: 'Transport' },
      ];

      mockGet.mockResolvedValue({ data: mockExpenses });

      const result = await expenseService.getExpensesByMonth(2024, 1);

      expect(result).toEqual(mockExpenses);
      expect(mockGet).toHaveBeenCalledWith('/month', {
        params: { year: 2024, month: 1 },
      });
    });
  });

  describe('getMultiCategoryTrend', () => {
    it('should fetch multi-category trend data with specific categories', async () => {
      const mockTrends: MultiCategoryTrend[] = [
        { category: 'Food', date: '2024-01-05', amount: 80 },
        { category: 'Transport', date: '2024-01-10', amount: 100 },
      ];

      mockGet.mockResolvedValue({ data: mockTrends });

      const result = await expenseService.getMultiCategoryTrend(
        ['Food', 'Transport'],
        '2024-01-01T00:00:00',
        '2024-01-31T23:59:59'
      );

      expect(result).toEqual(mockTrends);
      expect(mockGet).toHaveBeenCalledWith('/analytics/categories/trend', {
        params: {
          categories: ['Food', 'Transport'],
          startDate: '2024-01-01T00:00:00',
          endDate: '2024-01-31T23:59:59',
        },
      });
    });

    it('should fetch multi-category trend data for all categories when categories is null', async () => {
      const mockTrends: MultiCategoryTrend[] = [
        { category: 'Food', date: '2024-01-05', amount: 50 },
        { category: 'Transport', date: '2024-01-10', amount: 100 },
      ];

      mockGet.mockResolvedValue({ data: mockTrends });

      const result = await expenseService.getMultiCategoryTrend(
        null,
        '2024-01-01T00:00:00',
        '2024-01-31T23:59:59'
      );

      expect(result).toEqual(mockTrends);
      expect(mockGet).toHaveBeenCalledWith('/analytics/categories/trend', {
        params: {
          startDate: '2024-01-01T00:00:00',
          endDate: '2024-01-31T23:59:59',
        },
      });
    });
  });
});

