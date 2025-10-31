'use client';

import { LuGlobe2 } from 'react-icons/lu';

import useLocaleModal from '@/app/hooks/useLocaleModal';
import useLocaleSettings from '@/app/hooks/useLocaleSettings';
import useTranslations from '@/app/hooks/useTranslations';

const LocaleButton = () => {
  const modal = useLocaleModal();
  const { language, languageRegion, currency } = useLocaleSettings();
  const t = useTranslations();
  const summary = `${language} / ${languageRegion} - ${currency}`;

  return (
    <button
      type="button"
      onClick={modal.onOpen}
      className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black/20"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-sm">
        <LuGlobe2 className="h-4 w-4" />
      </span>
      <span className="hidden flex-col text-left leading-tight md:flex">
        <span className="text-xs uppercase tracking-wide text-neutral-400">{t('localeLabel')}</span>
        <span>{summary}</span>
      </span>
      <span className="md:hidden text-xs font-semibold text-neutral-600">{currency}</span>
    </button>
  );
};

export default LocaleButton;
