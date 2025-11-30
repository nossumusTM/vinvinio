import { BASE_CURRENCY, CURRENCY_RATES } from '@/app/(marketplace)/constants/locale';

type CurrencyRates = Record<string, number>;

// converts FROM sourceCurrency TO targetCurrency
export const convertCurrency = (
  amount: number,
  from: string,
  to: string,
  rates: CurrencyRates = CURRENCY_RATES,
  baseCurrency: string = BASE_CURRENCY
) => {
  if (from === to) return amount;

  const normalizedRates: CurrencyRates = { ...rates, [baseCurrency]: 1 };
  const fromRate = normalizedRates[from] ?? 1;
  const toRate = normalizedRates[to] ?? 1;

  // normalize amount to USD-equivalent, then convert
  const amountInBase = amount / fromRate;
  return amountInBase * toRate;
};

export const convertFromBase = (
  amount: number,
  targetCurrency: string,
  rates: CurrencyRates = CURRENCY_RATES,
  baseCurrency: string = BASE_CURRENCY
) => {
  const normalizedRates: CurrencyRates = { ...rates, [baseCurrency]: 1 };
  const rate = normalizedRates[targetCurrency] ?? 1;
  return amount * rate;
};

export const formatCurrencyValue = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
