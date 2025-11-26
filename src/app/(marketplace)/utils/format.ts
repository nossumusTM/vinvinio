import { CURRENCY_RATES } from '@/app/(marketplace)/constants/locale';

// converts FROM sourceCurrency TO targetCurrency
export const convertCurrency = (
  amount: number,
  from: string,
  to: string
) => {
  const fromRate = CURRENCY_RATES[from] ?? 1;
  const toRate = CURRENCY_RATES[to] ?? 1;

  // normalize amount to USD-equivalent, then convert
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
};

export const convertFromUSD = (amount: number, targetCurrency: string) => {
  const rate = CURRENCY_RATES[targetCurrency] ?? 1;
  return amount * rate;
};

export const formatCurrencyValue = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
