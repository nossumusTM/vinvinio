'use client';

import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

export type HostAnalyticsFilter = 'day' | 'month' | 'year';

interface FilterHostAnalyticsProps {
  filter: HostAnalyticsFilter;
  selectedDate: Date;
  onFilterChange: (filter: HostAnalyticsFilter) => void;
  onDateChange: (date: Date) => void;
}

const toMonthValue = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const toDateValue = (date: Date) => {
  const year = date.getUTCFullYear();
  return `${year}-01-01`;
};

// ✅ NEW
const toDayValue = (date: Date) => date.toISOString().slice(0, 10);

const FilterHostAnalytics: React.FC<FilterHostAnalyticsProps> = ({
  filter,
  selectedDate,
  onFilterChange,
  onDateChange,
}) => {
  const inputValue = useMemo(
    () => {
        if (filter === 'month') return toMonthValue(selectedDate);
        if (filter === 'year') return toDateValue(selectedDate);
        // day
        return toDayValue(selectedDate);
    },
    [filter, selectedDate],
    );

  const handleDateChange = (value: string) => {
    if (!value) return;

    let nextDate: Date;

    if (filter === 'month') {
        nextDate = new Date(`${value}-01T00:00:00Z`);
    } else if (filter === 'year') {
        const year = value.slice(0, 4);
        nextDate = new Date(`${year}-01-01T00:00:00Z`);
    } else {
        // day
        nextDate = new Date(`${value}T00:00:00Z`);
    }

    if (!Number.isNaN(nextDate.getTime())) {
        onDateChange(nextDate);
    }
    };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(
            [
            ['day', 'Day'],
            ['month', 'Month'],
            ['year', 'Year'],
            ] as [HostAnalyticsFilter, string][]
        ).map(([value, label]) => (
            <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={twMerge(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                filter === value
                ? 'border-black bg-black text-white'
                : 'border-neutral-200 text-neutral-700 hover:border-neutral-400',
            )}
            >
            {label}
            </button>
        ))}
        </div>


      <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-600">
        <span>{filter === 'month' ? 'Select month' : 'Select year'}</span>
        <input
          type={filter === 'month' ? 'month' : 'date'}
          value={inputValue}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
        />
      </label>
    </div>
  );
};

export default FilterHostAnalytics;