import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserDto,
  CreateUserRequestDto,
  CreateUserResponseDto,
  UpdateUserRequestDto,
} from '../../types/user';

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
        request: { use: vi.fn() },
        response: { use: vi.fn() },
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
import { userService } from '../userService';

describe('userService', () => {
  const mockUser: UserDto = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'USER',
    isActive: true,
    passwordSet: true,
    isDefaultAdmin: false,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all users', async () => {
      const mockUsers: UserDto[] = [
        mockUser,
        {
          id: 2,
          username: 'admin',
          email: 'admin@example.com',
          role: 'ADMIN',
          isActive: true,
          passwordSet: true,
          isDefaultAdmin: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockGet.mockResolvedValue({ data: mockUsers });

      const result = await userService.getAll();

      expect(result).toEqual(mockUsers);
      expect(mockGet).toHaveBeenCalledWith('');
    });
  });

  describe('getById', () => {
    it('should fetch a single user by id', async () => {
      mockGet.mockResolvedValue({ data: mockUser });

      const result = await userService.getById(1);

      expect(result).toEqual(mockUser);
      expect(mockGet).toHaveBeenCalledWith('/1');
    });

    it('should throw error when user not found', async () => {
      mockGet.mockRejectedValue({ response: { status: 404, data: 'User not found' } });

      await expect(userService.getById(999)).rejects.toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createRequest: CreateUserRequestDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        role: 'USER',
      };

      const createResponse: CreateUserResponseDto = {
        user: {
          id: 3,
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'USER',
          isActive: true,
          passwordSet: false,
          isDefaultAdmin: false,
          createdAt: '2024-01-15T00:00:00Z',
        },
        setupUrl: 'http://localhost:5173/setup?token=abc123',
      };

      mockPost.mockResolvedValue({ data: createResponse });

      const result = await userService.create(createRequest);

      expect(result).toEqual(createResponse);
      expect(mockPost).toHaveBeenCalledWith('', createRequest);
    });

    it('should throw error when username already exists', async () => {
      const createRequest: CreateUserRequestDto = {
        username: 'existinguser',
        email: 'new@example.com',
        role: 'USER',
      };

      mockPost.mockRejectedValue({
        response: { status: 409, data: 'Username already exists' },
      });

      await expect(userService.create(createRequest)).rejects.toBeDefined();
    });
  });

  describe('update', () => {
    it('should update an existing user', async () => {
      const updateRequest: UpdateUserRequestDto = {
        email: 'updated@example.com',
        role: 'ADMIN',
      };

      const updatedUser: UserDto = {
        ...mockUser,
        email: 'updated@example.com',
        role: 'ADMIN',
      };

      mockPut.mockResolvedValue({ data: updatedUser });

      const result = await userService.update(1, updateRequest);

      expect(result).toEqual(updatedUser);
      expect(mockPut).toHaveBeenCalledWith('/1', updateRequest);
    });

    it('should update user active status', async () => {
      const updateRequest: UpdateUserRequestDto = {
        isActive: false,
      };

      const updatedUser: UserDto = {
        ...mockUser,
        isActive: false,
      };

      mockPut.mockResolvedValue({ data: updatedUser });

      const result = await userService.update(1, updateRequest);

      expect(result.isActive).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      mockDelete.mockResolvedValue({});

      await userService.delete(1);

      expect(mockDelete).toHaveBeenCalledWith('/1');
    });

    it('should throw error when trying to delete non-existent user', async () => {
      mockDelete.mockRejectedValue({ response: { status: 404 } });

      await expect(userService.delete(999)).rejects.toBeDefined();
    });
  });

  describe('generateToken', () => {
    it('should generate a setup token for user', async () => {
      const mockResponse = {
        setupUrl: 'http://localhost:5173/setup?token=newtoken123',
      };

      mockPost.mockResolvedValue({ data: mockResponse });

      const result = await userService.generateToken(1);

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/1/generate-token');
    });

    it('should throw error for inactive user', async () => {
      mockPost.mockRejectedValue({
        response: { status: 400, data: 'Cannot generate token for inactive user' },
      });

      await expect(userService.generateToken(1)).rejects.toBeDefined();
    });
  });
});
