'use client';

import { useCallback, useMemo } from 'react';

import useLocaleSettings from '@/app/(marketplace)/hooks/useLocaleSettings';
import { convertFromUSD } from '@/app/(marketplace)/utils/format';
import { convertCurrency } from '@/app/(marketplace)/utils/format';
import { BASE_CURRENCY } from '@/app/(marketplace)/constants/locale';

const useCurrencyFormatter = () => {
  const { currency, locale } = useLocaleSettings();

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }),
    [currency, locale]
  );

  const format = useCallback((amount: number) => formatter.format(amount), [formatter]);

  const convert = useCallback(
    (amount: number, fromCurrency: string = BASE_CURRENCY) =>
      convertCurrency(amount, fromCurrency, currency),
    [currency]
  );

  const formatConverted = useCallback(
    (amount: number, fromCurrency: string = BASE_CURRENCY) =>
      format(convert(amount, fromCurrency)),
    [convert, format]
  );

  return { format, convert, formatConverted, currency, locale, baseCurrency: BASE_CURRENCY };
};

export default useCurrencyFormatter;
