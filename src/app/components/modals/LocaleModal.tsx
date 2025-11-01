'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import Image from 'next/image';

import Modal from './Modal';
import useLocaleModal from '@/app/hooks/useLocaleModal';
import useLocaleSettings from '@/app/hooks/useLocaleSettings';
import useTranslations from '@/app/hooks/useTranslations';

import { getCurrencyOption } from '@/app/constants/locale';

import {
  LANGUAGE_OPTIONS,
  CURRENCY_OPTIONS,
  type LanguageOption,
  type CurrencyOption,
} from '@/app/constants/locale';

type LocaleTab = 'language' | 'currency';

const LocaleModal = () => {
  const modal = useLocaleModal();
  const {
    language,
    languageCode,
    languageRegion,
    currency,
    currencyRegion,
    setLanguage,
    setCurrency,
  } = useLocaleSettings();
  const [activeTab, setActiveTab] = useState<LocaleTab>('language');
  const t = useTranslations();

  const curOpt = getCurrencyOption(currency);

  const activeLabel = useMemo(
    () => (activeTab === 'language' ? t('chooseLanguage') : t('selectRegionCurrency')),
    [activeTab, t]
  );

  const handleLanguageSelect = (option: LanguageOption) => {
    setLanguage(option.code);
  };

  const handleCurrencySelect = (option: CurrencyOption) => {
    setCurrency(option.code);
  };

  const renderLanguageOption = (option: LanguageOption) => {
    const isSelected = option.code === languageCode;

    return (
      <button
        key={option.code}
        type="button"
        onClick={() => handleLanguageSelect(option)}
        className={clsx(
          'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/30',
          isSelected
            ? 'border-black/60 bg-black text-white shadow-lg'
            : 'border-black/10 bg-white/90 backdrop-blur'
        )}
      >
        <Image
          src={`/flags/${option.flag}.svg`}
          alt={option.language}
          width={28}
          height={18}
          className="h-5 w-7 rounded object-cover"
        />
        <div className="flex flex-col">
          <span className={clsx('text-sm font-semibold', isSelected ? 'text-white' : 'text-neutral-900')}>
            {option.language}
          </span>
          <span className={clsx('text-xs uppercase tracking-wide', isSelected ? 'text-white/70' : 'text-neutral-500')}>
            {option.region}
          </span>
        </div>
      </button>
    );
  };

  const renderCurrencyOption = (option: CurrencyOption) => {
    const isSelected = option.code === currency;

    return (
      <button
        key={option.code}
        type="button"
        onClick={() => handleCurrencySelect(option)}
        className={clsx(
          'flex items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/30',
          isSelected
            ? 'border-black/60 bg-black text-white shadow-lg'
            : 'border-black/10 bg-white/90 backdrop-blur'
        )}
      >
        <Image
          src={`/flags/${option.flag}.svg`}
          alt={option.currencyName}
          width={28}
          height={18}
          className="h-5 w-7 rounded object-cover"
        />
        <div className="flex flex-col">
          <span className={clsx('text-sm font-semibold', isSelected ? 'text-white' : 'text-neutral-900')}>
            {option.currency}
          </span>

          <span className={clsx('text-xs uppercase tracking-wide', isSelected ? 'text-white/70' : 'text-neutral-500')}>
            {option.region} · {option.symbol}
          </span>

        </div>
      </button>
    );
  };

  const bodyContent = (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('language')}
          className={clsx(
            'rounded-full px-6 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-black/30',
            activeTab === 'language'
              ? 'bg-black text-white shadow-lg'
              : 'bg-white/80 text-neutral-700 ring-1 ring-black/10'
          )}
        >
          {t('languageLabel')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('currency')}
          className={clsx(
            'rounded-full px-6 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-black/30',
            activeTab === 'currency'
              ? 'bg-black text-white shadow-lg'
              : 'bg-white/80 text-neutral-700 ring-1 ring-black/10'
          )}
        >
          {t('regionCurrencyLabel')}
        </button>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-white via-white to-slate-100 p-1">
        <div className="rounded-[26px] bg-white/90 p-6 shadow-inner">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">{activeLabel}</p>
              <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                {language} / {languageRegion}
              </h3>
              <p className="text-xs text-neutral-500">
                {currencyRegion} · {curOpt.symbol}
              </p>
            </div>
          </div>
          <div className="grid max-h-[210px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {activeTab === 'language'
              ? LANGUAGE_OPTIONS.map(renderLanguageOption)
              : CURRENCY_OPTIONS.map(renderCurrencyOption)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={modal.isOpen}
      onClose={modal.onClose}
      onSubmit={modal.onClose}
      actionLabel={t('done')}
      title={t('personaliseExperience')}
      body={bodyContent}
      className="max-h-[70vh]"
    />
  );
};

export default LocaleModal;
