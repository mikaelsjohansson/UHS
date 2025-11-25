import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Create a mock clipboard object that persists across tests
const mockClipboard = {
  writeText: vi.fn(),
  readText: vi.fn(),
};

// Mock clipboard API globally for all tests
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
  configurable: true,
});

// Export for tests to use
export { mockClipboard };

// Re-setup mock implementations before each test
beforeEach(() => {
  mockClipboard.writeText.mockResolvedValue(undefined);
  mockClipboard.readText.mockResolvedValue('');
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

