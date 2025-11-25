import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

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
    clear: () => {
      store = {};
    },
    reset: () => {
      store = {};
    },
  };
});

// Setup localStorage mock before tests
beforeEach(() => {
  mockLocalStorage.clear();
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Management', () => {
    it('should export AUTH_TOKEN_KEY constant', async () => {
      const { AUTH_TOKEN_KEY } = await import('../client');
      expect(AUTH_TOKEN_KEY).toBe('auth_token');
    });

    it('getToken should return null when no token is stored', async () => {
      const { getToken } = await import('../client');
      expect(getToken()).toBeNull();
    });

    it('getToken should return stored token', async () => {
      mockLocalStorage.setItem('auth_token', 'test-token-123');
      const { getToken } = await import('../client');
      expect(getToken()).toBe('test-token-123');
    });

    it('setToken should store token in localStorage', async () => {
      const { setToken } = await import('../client');
      setToken('new-token-456');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token-456');
    });

    it('removeToken should remove token from localStorage', async () => {
      const { removeToken } = await import('../client');
      removeToken();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('isAuthenticated should return false when no token', async () => {
      const { isAuthenticated } = await import('../client');
      expect(isAuthenticated()).toBe(false);
    });

    it('isAuthenticated should return true when token exists', async () => {
      mockLocalStorage.setItem('auth_token', 'test-token');
      const { isAuthenticated } = await import('../client');
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('createApiClient', () => {
    it('should create axios instance with correct baseURL', async () => {
      const createSpy = vi.spyOn(axios, 'create');
      const { createApiClient } = await import('../client');

      createApiClient('/api/test');

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: '/api/test',
        })
      );
    });

    it('should set Content-Type header to application/json', async () => {
      const createSpy = vi.spyOn(axios, 'create');
      const { createApiClient } = await import('../client');

      createApiClient('/api/test');

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Request Interceptor', () => {
    it('should attach Authorization header when token exists', async () => {
      mockLocalStorage.setItem('auth_token', 'jwt-token-123');

      // Create a mock axios instance to test interceptor behavior
      const mockRequestUse = vi.fn();
      const mockResponseUse = vi.fn();
      const mockInstance = {
        interceptors: {
          request: { use: mockRequestUse },
          response: { use: mockResponseUse },
        },
      };

      vi.spyOn(axios, 'create').mockReturnValue(mockInstance as any);

      const { createApiClient } = await import('../client');
      createApiClient('/api/test');

      // Get the request interceptor function
      expect(mockRequestUse).toHaveBeenCalled();
      const requestInterceptor = mockRequestUse.mock.calls[0][0];

      // Test that it adds the Authorization header
      const config = { headers: {} as Record<string, string> };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer jwt-token-123');
    });

    it('should not attach Authorization header when no token', async () => {
      const mockRequestUse = vi.fn();
      const mockResponseUse = vi.fn();
      const mockInstance = {
        interceptors: {
          request: { use: mockRequestUse },
          response: { use: mockResponseUse },
        },
      };

      vi.spyOn(axios, 'create').mockReturnValue(mockInstance as any);

      const { createApiClient } = await import('../client');
      createApiClient('/api/test');

      const requestInterceptor = mockRequestUse.mock.calls[0][0];

      const config = { headers: {} as Record<string, string> };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should pass through successful responses', async () => {
      const mockRequestUse = vi.fn();
      const mockResponseUse = vi.fn();
      const mockInstance = {
        interceptors: {
          request: { use: mockRequestUse },
          response: { use: mockResponseUse },
        },
      };

      vi.spyOn(axios, 'create').mockReturnValue(mockInstance as any);

      const { createApiClient } = await import('../client');
      createApiClient('/api/test');

      const responseInterceptor = mockResponseUse.mock.calls[0][0];

      const response = { data: 'test', status: 200 };
      const result = responseInterceptor(response);

      expect(result).toEqual(response);
    });

    it('should remove token on 401 error', async () => {
      mockLocalStorage.setItem('auth_token', 'expired-token');

      const mockRequestUse = vi.fn();
      const mockResponseUse = vi.fn();
      const mockInstance = {
        interceptors: {
          request: { use: mockRequestUse },
          response: { use: mockResponseUse },
        },
      };

      vi.spyOn(axios, 'create').mockReturnValue(mockInstance as any);

      const { createApiClient } = await import('../client');
      createApiClient('/api/test');

      const errorHandler = mockResponseUse.mock.calls[0][1];

      const error = { response: { status: 401 } };

      await expect(errorHandler(error)).rejects.toEqual(error);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should not remove token on non-401 errors', async () => {
      mockLocalStorage.setItem('auth_token', 'valid-token');

      const mockRequestUse = vi.fn();
      const mockResponseUse = vi.fn();
      const mockInstance = {
        interceptors: {
          request: { use: mockRequestUse },
          response: { use: mockResponseUse },
        },
      };

      vi.spyOn(axios, 'create').mockReturnValue(mockInstance as any);

      const { createApiClient } = await import('../client');
      createApiClient('/api/test');

      const errorHandler = mockResponseUse.mock.calls[0][1];

      const error = { response: { status: 500 } };

      await expect(errorHandler(error)).rejects.toEqual(error);
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });
});
