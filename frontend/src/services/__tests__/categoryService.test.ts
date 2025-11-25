import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Category } from '../../types/category';

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
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
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
import { categoryService } from '../categoryService';

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Food' },
        { id: 2, name: 'Transport' },
      ];

      mockGet.mockResolvedValue({ data: mockCategories });

      const result = await categoryService.getAllCategories();

      expect(result).toEqual(mockCategories);
      expect(mockGet).toHaveBeenCalledWith('');
    });

    it('should handle errors when fetching categories', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(categoryService.getAllCategories()).rejects.toThrow('Network error');
    });
  });

  describe('getCategoryById', () => {
    it('should fetch a category by id', async () => {
      const mockCategory: Category = { id: 1, name: 'Food' };
      mockGet.mockResolvedValue({ data: mockCategory });

      const result = await categoryService.getCategoryById(1);

      expect(result).toEqual(mockCategory);
      expect(mockGet).toHaveBeenCalledWith('/1');
    });
  });

  describe('createCategory', () => {
    it('should create a new category', async () => {
      const newCategory: Omit<Category, 'id'> = { name: 'Food' };
      const createdCategory: Category = { id: 1, name: 'Food' };
      mockPost.mockResolvedValue({ data: createdCategory });

      const result = await categoryService.createCategory(newCategory);

      expect(result).toEqual(createdCategory);
      expect(mockPost).toHaveBeenCalledWith('', newCategory);
    });
  });

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      const updatedCategory: Omit<Category, 'id'> = { name: 'Updated Food' };
      const resultCategory: Category = { id: 1, name: 'Updated Food' };
      mockPut.mockResolvedValue({ data: resultCategory });

      const result = await categoryService.updateCategory(1, updatedCategory);

      expect(result).toEqual(resultCategory);
      expect(mockPut).toHaveBeenCalledWith('/1', updatedCategory);
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      mockDelete.mockResolvedValue({});

      await categoryService.deleteCategory(1);

      expect(mockDelete).toHaveBeenCalledWith('/1');
    });
  });
});

