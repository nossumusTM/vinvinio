'use client';

import Select, { components, type MenuProps } from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import Image from 'next/image';
import { CountrySelectValue } from "@/app/(marketplace)/components/inputs/CountrySelect";

interface OnlyCountrySelectProps {
  value?: CountrySelectValue;
  onChange: (value: CountrySelectValue) => void;
}

const AnimatedMenu = (props: MenuProps<CountrySelectValue, false>) => {
  const { Menu } = components;

  return (
    <AnimatePresence>
      {props.selectProps.menuIsOpen && (
        <motion.div
          key="country-select-menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl shadow-xl overflow-hidden bg-white"
        >
          <Menu {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const OnlyCountrySelect: React.FC<OnlyCountrySelectProps> = ({ value, onChange }) => {
  const { getAll } = useCountries();
  const options = getAll().sort((a, b) => a.label.localeCompare(b.label));

  const formatLabel = (option: CountrySelectValue | null) => {
    if (!option) return null;

    const countryCode = option.value.toLowerCase();

    return (
      <div className="flex flex-row items-center gap-3 rounded-xl">
        <Image
          src={`/flags/${countryCode}.svg`}
          alt={option.label}
          width={28}
          height={20}
          className="h-5 w-7 rounded-md object-cover shadow-sm"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-neutral-900">{option.label}</span>
          <span className="text-xs text-neutral-500">{option.region}</span>
        </div>
      </div>
    );
  };

  return (
    <Select<CountrySelectValue, false>
      placeholder="Select Country"
      isClearable
      isSearchable
      options={options}
      value={value}
      onChange={(selected, actionMeta) => {
        if (actionMeta.action === 'clear') {
          onChange(undefined as unknown as CountrySelectValue);
          setTimeout(() => {
            const control = document.querySelector('.react-select__control') as HTMLElement;
            control?.click();
          }, 0);
          return;
        }

        onChange(selected as CountrySelectValue);
      }}
      formatOptionLabel={formatLabel}
      classNames={{
        control: (state) =>
          `p-2.5 border-2 rounded-xl shadow-sm ${
            state.isFocused ? 'border-neutral-800' : 'border-neutral-200'
          }`,
        input: () => 'text-base',
        option: (state) =>
          `text-sm ${
            state.isSelected
              ? 'bg-neutral-900 text-white'
              : state.isFocused
              ? 'bg-neutral-100'
              : ''
          }`,
        menu: () => 'bg-transparent shadow-none rounded-none',
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 12,
        colors: {
          ...theme.colors,
          primary: '#111',
          primary25: '#f5f5f4',
          neutral0: 'white',
          neutral20: '#d4d4d4',
          neutral30: '#a3a3a3',
          neutral80: '#111',
        },
      })}
      getOptionLabel={(option) => option.label}
      components={{
        Menu: AnimatedMenu,
        IndicatorSeparator: () => null,
      }}
    />
  );
};

export default OnlyCountrySelect;