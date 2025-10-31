import { CURRENCY_RATES } from '@/app/constants/locale';

export const convertFromUSD = (amount: number, targetCurrency: string) => {
  const rate = CURRENCY_RATES[targetCurrency] ?? 1;
  return amount * rate;
};

export const formatCurrencyValue = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
