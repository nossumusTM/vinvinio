'use client';

import type { IconType } from 'react-icons';

interface CategoryInputProps {
  icon: IconType;
  label: string;
  selected?: boolean;
  onClick: (value: string) => void;
}

const CategoryInput: React.FC<CategoryInputProps> = ({
  icon: Icon,
  label,
  selected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(label)}
      aria-pressed={!!selected}
      aria-label={label}
      className={[
        'group w-full rounded-2xl p-5',
        'flex flex-col items-center justify-center gap-3 text-center',
        'bg-white shadow-sm transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-black/20',
        selected ? 'scale-[1.02] shadow-xl shadow-neutral-400/40' : '',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-14 w-14 items-center justify-center rounded-xl',
          'bg-neutral-50 shadow-sm transition-transform duration-200',
          'group-hover:scale-105',
          selected ? 'shadow-md' : '',
        ].join(' ')}
      >
        <Icon className="h-8 w-8 text-neutral-700" aria-hidden="true" />
      </div>
      <div className="text-xs font-semibold leading-tight text-neutral-900">
        {label}
      </div>
    </button>
  );
};

export default CategoryInput;