import { configService } from '../services/configService';

let currency: string = 'USD'; // Default currency
let currencyInitialized: boolean = false;

/**
 * Initialize currency from backend configuration
 */
export const initializeCurrency = async (): Promise<void> => {
  if (currencyInitialized) {
    return; // Already initialized
  }
  
  try {
    const config = await configService.getConfig();
    currency = config.currency || 'USD';
    currencyInitialized = true;
    console.log(`Currency initialized to: ${currency}`);
  } catch (error) {
    console.warn('Failed to load currency configuration, using default USD', error);
    currency = 'USD';
    currencyInitialized = true;
  }
};

/**
 * Get current currency (for debugging)
 */
export const getCurrency = (): string => {
  return currency;
};

/**
 * Format a number as currency using the configured currency
 */
export const formatCurrency = (value: number): string => {
  // Determine locale based on currency
  const locale = currency === 'SEK' ? 'sv-SE' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

/**
 * Set currency directly (useful for testing)
 * @internal
 */
export const setCurrency = (newCurrency: string): void => {
  currency = newCurrency;
  currencyInitialized = true;
};

/**
 * Reset currency initialization state (useful for testing)
 * @internal
 */
export const resetCurrency = (): void => {
  currency = 'USD';
  currencyInitialized = false;
};

