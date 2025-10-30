'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';

import Modal from './Modal';
import useLocaleModal from '@/app/hooks/useLocaleModal';
import useLocaleSettings from '@/app/hooks/useLocaleSettings';

type LocaleOption = {
  language: string;
  currency: string;
  flag: string;
  region: string;
};

const localeOptions: LocaleOption[] = [
  { language: 'English', currency: 'USD', flag: '🇺🇸', region: 'United States' },
  { language: 'Azerbaijani', currency: 'AZN', flag: '🇦🇿', region: 'Azerbaijan' },
  { language: 'Deutsch', currency: 'EUR', flag: '🇩🇪', region: 'Germany' },
  { language: 'Español', currency: 'EUR', flag: '🇪🇸', region: 'Spain' },
  { language: 'Français', currency: 'EUR', flag: '🇫🇷', region: 'France' },
  { language: 'Italiano', currency: 'EUR', flag: '🇮🇹', region: 'Italy' },
  { language: 'Nederlands', currency: 'EUR', flag: '🇳🇱', region: 'Netherlands' },
  { language: 'Polski', currency: 'PLN', flag: '🇵🇱', region: 'Poland' },
  { language: 'Turkish', currency: 'TRY', flag: '🇹🇷', region: 'Türkiye' },
  { language: 'Russian', currency: 'RUB', flag: '🇷🇺', region: 'Russia' },
  { language: 'Chinese', currency: 'CNY', flag: '🇨🇳', region: 'China' },
  { language: 'Japanese', currency: 'JPY', flag: '🇯🇵', region: 'Japan' },
  { language: 'Arabic', currency: 'AED', flag: '🇦🇪', region: 'United Arab Emirates' },
];

type LocaleTab = 'language' | 'currency';

const LocaleModal = () => {
  const modal = useLocaleModal();
  const { language, currency, setLanguage, setCurrency } = useLocaleSettings();
  const [activeTab, setActiveTab] = useState<LocaleTab>('language');

  const activeLabel = useMemo(() => (
    activeTab === 'language' ? 'Choose your language' : 'Select your region & currency'
  ), [activeTab]);

  const handleLanguageSelect = (option: LocaleOption) => {
    setLanguage(option.language, option.currency);
  };

  const handleCurrencySelect = (option: LocaleOption) => {
    setCurrency(option.language, option.currency);
  };

  const renderOption = (option: LocaleOption) => {
    const isSelected =
      activeTab === 'language'
        ? option.language === language
        : option.currency === currency;

    return (
      <button
        key={`${option.language}-${option.currency}`}
        type="button"
        onClick={() => (activeTab === 'language' ? handleLanguageSelect(option) : handleCurrencySelect(option))}
        className={clsx(
          'flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/30',
          isSelected
            ? 'border-black/60 bg-black text-white shadow-lg'
            : 'border-black/10 bg-white/90 backdrop-blur'
        )}
      >
        <span className="text-2xl">{option.flag}</span>
        <div className="flex flex-col">
          <span className={clsx('text-sm font-semibold', isSelected ? 'text-white' : 'text-neutral-900')}>
            {option.language}
          </span>
          <span className={clsx('text-xs uppercase tracking-wide', isSelected ? 'text-white/70' : 'text-neutral-500')}>
            {activeTab === 'language' ? option.region : `${option.region} · ${option.currency}`}
          </span>
        </div>
      </button>
    );
  };

  const bodyContent = (
    <div className="flex flex-col gap-8">
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
          Language
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
          Region / Currency
        </button>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-white via-white to-slate-100 p-1">
        <div className="rounded-[26px] bg-white/90 p-6 shadow-inner">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">{activeLabel}</p>
              <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                {language} · {currency}
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {localeOptions.map(renderOption)}
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
      actionLabel="Done"
      title="Personalise your experience"
      body={bodyContent}
      className="bg-transparent"
    />
  );
};

export default LocaleModal;
