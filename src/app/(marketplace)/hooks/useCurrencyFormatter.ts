'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import useLocaleSettings from '@/app/(marketplace)/hooks/useLocaleSettings';
import { convertCurrency } from '@/app/(marketplace)/utils/format';
import { BASE_CURRENCY, CURRENCY_RATES, getCurrencyOption } from '@/app/(marketplace)/constants/locale';

const useCurrencyFormatter = () => {
  const { currency, locale } = useLocaleSettings();
  const [rates, setRates] = useState<Record<string, number>>(CURRENCY_RATES);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRates = async () => {
      try {
        const response = await fetch(`https://api.exchangerate.host/latest?base=${BASE_CURRENCY}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch currency rates');
        }

        const data = await response.json();

        if (data?.rates) {
          setRates((current) => ({ ...current, ...data.rates, [BASE_CURRENCY]: 1 }));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Unable to refresh currency rates', error);
      }
    };

    fetchRates();
    const refreshInterval = window.setInterval(fetchRates, 30 * 60 * 1000);

    return () => {
      controller.abort();
      window.clearInterval(refreshInterval);
    };
  }, []);

  const formatter = useMemo(
  () =>
        new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }),
    [currency, locale]
  );

  const currencySymbol = useMemo(() => getCurrencyOption(currency).symbol, [currency]);

    const format = useCallback(
      (amount: number) =>
        formatter
          .formatToParts(amount)
          .map((part) => (part.type === 'currency' ? currencySymbol : part.value))
          .join(''),
      [currencySymbol, formatter]
    );

  const convert = useCallback(
    (amount: number, fromCurrency: string = BASE_CURRENCY) =>
      convertCurrency(amount, fromCurrency, currency, rates, BASE_CURRENCY),
    [currency, rates]
  );

  const formatConverted = useCallback(
    (amount: number, fromCurrency: string = BASE_CURRENCY) =>
      format(convert(amount, fromCurrency)),
    [convert, format]
  );

  return { format, convert, formatConverted, currency, locale, baseCurrency: BASE_CURRENCY };
};

export default useCurrencyFormatter;
