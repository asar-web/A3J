export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rateAgainstUSD: number; // 1 USD = rate units of currency
  locale: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    code: 'LKR',
    symbol: 'Rs. ',
    name: 'Sri Lankan Rupee (LKR)',
    rateAgainstUSD: 305.0,
    locale: 'en-LK',
    decimals: 2,
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar (USD)',
    rateAgainstUSD: 1.0,
    locale: 'en-US',
    decimals: 2,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro (EUR)',
    rateAgainstUSD: 0.92,
    locale: 'de-DE',
    decimals: 2,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound (GBP)',
    rateAgainstUSD: 0.78,
    locale: 'en-GB',
    decimals: 2,
  },
  {
    code: 'AED',
    symbol: 'AED ',
    name: 'UAE Dirham (AED)',
    rateAgainstUSD: 3.67,
    locale: 'ar-AE',
    decimals: 2,
  },
  {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee (INR)',
    rateAgainstUSD: 83.4,
    locale: 'en-IN',
    decimals: 2,
  },
  {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar (CAD)',
    rateAgainstUSD: 1.36,
    locale: 'en-CA',
    decimals: 2,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar (AUD)',
    rateAgainstUSD: 1.52,
    locale: 'en-AU',
    decimals: 2,
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen (JPY)',
    rateAgainstUSD: 154.5,
    locale: 'ja-JP',
    decimals: 0,
  },
];

export const DEFAULT_CURRENCY: Currency = SUPPORTED_CURRENCIES[0]; // LKR is Default!

export function convertFromUSD(amountUSD: number, currency: Currency): number {
  return Number((amountUSD * currency.rateAgainstUSD).toFixed(currency.decimals));
}

export function formatPrice(amountUSD: number, currency: Currency): string {
  const converted = amountUSD * currency.rateAgainstUSD;
  if (currency.decimals === 0) {
    return `${currency.symbol}${Math.round(converted).toLocaleString(currency.locale)}`;
  }
  return `${currency.symbol}${converted.toLocaleString(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  })}`;
}
