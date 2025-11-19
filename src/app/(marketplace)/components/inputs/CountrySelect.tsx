'use client';

import Select, { components, type MenuProps } from 'react-select';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import Image from 'next/image';

export type CountrySelectValue = {
  flag: string;
  label: string;
  latlng: number[];
  region: string;
  value: string;
  city?: string;
};

interface CountrySelectProps {
  value?: CountrySelectValue;
  onChange: (value: CountrySelectValue) => void;
}

// 🔽 Framer-motion variants for the menu
const menuVariants: Variants = {
  collapsed: {
    opacity: 0,
    y: -8,
    scaleY: 0.95,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  },
  open: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] },
  },
};

// 🎭 Animated Menu wrapper
const AnimatedMenu = (props: MenuProps<CountrySelectValue, false>) => {
  const { Menu } = components;

  return (
    <AnimatePresence>
      {props.selectProps.menuIsOpen && (
        <motion.div
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={menuVariants}
          style={{ originY: 0 }} // animate from top
        >
          <Menu {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange }) => {
  const { getAll, getPopularCities } = useCountries();

  const options = [...getPopularCities(), ...getAll()].sort((a, b) =>
    a.label.toLowerCase().localeCompare(b.label.toLowerCase()),
  );

  const formatLabel = (option: any) => {
    if (!option || !option.value) return null;

    const countryCode = option.value.includes('-')
      ? option.value.split('-').pop()?.toLowerCase()
      : option.value.toLowerCase();

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
          <span className="text-sm font-medium text-neutral-900">
            {option.city ? `${option.city}` : option.label}
          </span>
          <span className="text-xs text-neutral-500">
            {option.city ? `${option.label}` : option.label} • {option.region}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Select<CountrySelectValue, false>
        placeholder="Select Country or City"
        isClearable
        isSearchable
        options={options}
        value={value}
        onChange={(selected, actionMeta) => {
          if (actionMeta.action === 'clear') {
            onChange(undefined as unknown as CountrySelectValue);
            // optional hack to reopen after clear
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
          menu: () => 'rounded-2xl overflow-hidden shadow-xl',
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
        getOptionLabel={(option) =>
          option.city ? `${option.city}, ${option.label}` : option.label
        }
        // 🧩 inject animated Menu here
        components={{
          Menu: AnimatedMenu,
          IndicatorSeparator: () => null,
        }}
      />
    </div>
  );
};

export default CountrySelect;
