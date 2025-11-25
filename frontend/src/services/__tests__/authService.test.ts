import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  UserDto,
  LoginResponseDto,
  TokenValidationResponseDto,
  SetupStatusDto,
} from '../../types/user';

// Create mocks using vi.hoisted to ensure they're available before module import
const { mockGet, mockPost, mockApiInstance } = vi.hoisted(() => {
  const get = vi.fn();
  const post = vi.fn();

  return {
    mockGet: get,
    mockPost: post,
    mockApiInstance: {
      get,
      post,
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

// Mock localStorage
const mockLocalStorage = vi.hoisted(() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
});

// Import after mocking
import { authService, AUTH_TOKEN_KEY } from '../authService';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('login', () => {
    it('should login user and store token in localStorage', async () => {
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

      const mockResponse: LoginResponseDto = {
        token: 'jwt-token-123',
        user: mockUser,
        expiresAt: '2024-01-02T00:00:00Z',
      };

      mockPost.mockResolvedValue({ data: mockResponse });

      const result = await authService.login('testuser', 'password123');

      expect(result).toEqual(mockResponse);
      expect(mockPost).toHaveBeenCalledWith('/login', {
        username: 'testuser',
        password: 'password123',
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY, 'jwt-token-123');
    });

    it('should throw error on invalid credentials', async () => {
      mockPost.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', async () => {
      mockLocalStorage.setItem(AUTH_TOKEN_KEY, 'jwt-token-123');
      mockPost.mockResolvedValue({});

      await authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(AUTH_TOKEN_KEY);
    });

    it('should call logout endpoint', async () => {
      mockPost.mockResolvedValue({});

      await authService.logout();

      expect(mockPost).toHaveBeenCalledWith('/logout');
    });
  });

  describe('getMe', () => {
    it('should fetch current user', async () => {
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

      mockGet.mockResolvedValue({ data: mockUser });

      const result = await authService.getMe();

      expect(result).toEqual(mockUser);
      expect(mockGet).toHaveBeenCalledWith('/me');
    });

    it('should return null when not authenticated', async () => {
      mockGet.mockRejectedValue({ response: { status: 401 } });

      const result = await authService.getMe();

      expect(result).toBeNull();
    });
  });

  describe('isSetupRequired', () => {
    it('should return setup status', async () => {
      const mockStatus: SetupStatusDto = { setupRequired: true };

      mockGet.mockResolvedValue({ data: mockStatus });

      const result = await authService.isSetupRequired();

      expect(result).toEqual(mockStatus);
      expect(mockGet).toHaveBeenCalledWith('/setup-required');
    });
  });

  describe('setupAdmin', () => {
    it('should setup admin password', async () => {
      mockPost.mockResolvedValue({});

      await authService.setupAdmin('newPassword123');

      expect(mockPost).toHaveBeenCalledWith('/setup-admin', { password: 'newPassword123' });
    });
  });

  describe('setPassword', () => {
    it('should set password using token', async () => {
      mockPost.mockResolvedValue({});

      await authService.setPassword('setup-token-123', 'newPassword123');

      expect(mockPost).toHaveBeenCalledWith('/set-password/setup-token-123', {
        password: 'newPassword123',
      });
    });
  });

  describe('validateToken', () => {
    it('should validate setup token', async () => {
      const mockResponse: TokenValidationResponseDto = {
        valid: true,
        username: 'testuser',
        expiresAt: '2024-01-02T00:00:00Z',
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await authService.validateToken('setup-token-123');

      expect(result).toEqual(mockResponse);
      expect(mockGet).toHaveBeenCalledWith('/validate-token/setup-token-123');
    });

    it('should return invalid response for expired token', async () => {
      const mockResponse: TokenValidationResponseDto = {
        valid: false,
        username: '',
        expiresAt: '',
      };

      mockGet.mockResolvedValue({ data: mockResponse });

      const result = await authService.validateToken('expired-token');

      expect(result.valid).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      mockLocalStorage.setItem(AUTH_TOKEN_KEY, 'jwt-token-123');

      const token = authService.getToken();

      expect(token).toBe('jwt-token-123');
    });

    it('should return null when no token stored', () => {
      const token = authService.getToken();

      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      mockLocalStorage.setItem(AUTH_TOKEN_KEY, 'jwt-token-123');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', () => {
      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
