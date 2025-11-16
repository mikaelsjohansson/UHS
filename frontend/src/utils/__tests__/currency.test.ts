import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { formatCurrency, initializeCurrency, setCurrency, resetCurrency } from '../currency';
import { configService } from '../../services/configService';

vi.mock('../../services/configService');

describe('currency utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset currency state before each test
    resetCurrency();
  });

  afterEach(() => {
    // Reset currency state after each test
    resetCurrency();
  });

  describe('initializeCurrency', () => {
    it('should fetch and set currency from config service', async () => {
      const mockConfig = { currency: 'SEK' };
      vi.mocked(configService.getConfig).mockResolvedValue(mockConfig);

      await initializeCurrency();

      expect(configService.getConfig).toHaveBeenCalledOnce();
      const formatted = formatCurrency(100);
      expect(formatted).toContain('kr');
    });

    it('should default to USD if config fetch fails', async () => {
      vi.mocked(configService.getConfig).mockRejectedValue(new Error('Network error'));

      await initializeCurrency();

      // Should not throw, and currency should default to USD
      const formatted = formatCurrency(100);
      expect(formatted).toContain('$');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with SEK when initialized', async () => {
      const mockConfig = { currency: 'SEK' };
      vi.mocked(configService.getConfig).mockResolvedValue(mockConfig);

      await initializeCurrency();
      const formatted = formatCurrency(1234.56);

      expect(formatted).toContain('kr');
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });

    it('should format currency with USD as default', () => {
      // Ensure USD is set
      setCurrency('USD');
      const formatted = formatCurrency(1234.56);

      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
    });
  });
});

