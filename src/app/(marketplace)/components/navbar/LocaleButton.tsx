'use client';

import { LuGlobe2 } from 'react-icons/lu';

import useLocaleModal from '@/app/(marketplace)/hooks/useLocaleModal';
import useLocaleSettings from '@/app/(marketplace)/hooks/useLocaleSettings';
import useTranslations from '@/app/(marketplace)/hooks/useTranslations';
import { getCurrencyOption } from '@/app/(marketplace)/constants/locale';

const LocaleButton = () => {
  const modal = useLocaleModal();
  const { language, languageRegion, currency, currencyRegion } = useLocaleSettings();
  const t = useTranslations();
  const currencyOption = getCurrencyOption(currency);
  // const summary = `${language} | ${currencyRegion} - ${currencyOption.symbol}`;

  const { currencySymbol } = useLocaleSettings();

  return (
    <button
      type="button"
      onClick={modal.onOpen}
      className="inline-flex w-full ml-[-15px] md:ml-0 items-center gap-2 rounded-full backdrop-blur px-3.5 py-1.5 text-sm font-medium text-neutral-700 md:shadow-md transition md:hover:shadow-lg"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-900 shadow-md">
        <LuGlobe2 className="h-4 w-4" />
      </span>
      {/* <span className="hidden flex-col text-left leading-tight md:flex">

        <span className="hidden md:flex flex-col text-left leading-tight">
          <span className="text-[8px] uppercase tracking-wide text-neutral-400">
            {t('localeLabel')}
          </span>
          <span className="flex items-center font-semibold">
            <span>{language}</span>

            <span aria-hidden className="mx-2 h-4 w-px bg-neutral-300" />
            <span>{currencyOption.symbol}</span>
          </span>
        </span>
      </span> */}

      <span className="flex flex-col text-left leading-tight">
        <span className="text-[8px] uppercase tracking-wide text-neutral-400">
          {t('localeLabel')}
        </span>
        <span className="flex items-center font-semibold text-xs md:text-sm">
          <span>{language}</span>
          <span aria-hidden className="mx-2 h-4 w-px bg-neutral-300" />
          <span>{currencyOption.symbol}</span>
        </span>
      </span>
      {/* <span className="md:hidden text-xs font-semibold text-neutral-600">{currencySymbol}</span> */}
    </button>
  );
};

export default LocaleButton;
