'use client';

import { useCallback, useMemo } from 'react';

import useLocaleSettings from '@/app/(marketplace)/hooks/useLocaleSettings';
import { convertFromUSD } from '@/app/(marketplace)/utils/format';

const useCurrencyFormatter = () => {
  const { currency, locale } = useLocaleSettings();

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }),
    [currency, locale]
  );

  const format = useCallback((amount: number) => formatter.format(amount), [formatter]);

  const convert = useCallback(
    (amount: number) => convertFromUSD(amount, currency),
    [currency]
  );

  const formatConverted = useCallback(
    (amount: number) => format(convert(amount)),
    [convert, format]
  );

  return { format, convert, formatConverted, currency, locale };
};

export default useCurrencyFormatter;
