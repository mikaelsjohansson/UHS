import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mocks using vi.hoisted to ensure they're available before module import
const { mockGet, mockApiInstance } = vi.hoisted(() => {
  const get = vi.fn();
  
  return {
    mockGet: get,
    mockApiInstance: {
      get,
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
import { configService } from '../configService';

describe('configService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should fetch config with currency', async () => {
      const mockConfig = { currency: 'SEK' };

      mockGet.mockResolvedValue({ data: mockConfig });

      const result = await configService.getConfig();

      expect(result).toEqual(mockConfig);
      expect(mockGet).toHaveBeenCalledWith('');
    });
  });
});

