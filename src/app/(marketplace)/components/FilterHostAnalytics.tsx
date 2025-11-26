'use client';

import { useMemo, useRef } from 'react';
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

const toDateValue = (date: Date) => date.toISOString().slice(0, 10);

// ✅ NEW
const toDayValue = (date: Date) => date.toISOString().slice(0, 10);

const FilterHostAnalytics: React.FC<FilterHostAnalyticsProps> = ({
  filter,
  selectedDate,
  onFilterChange,
  onDateChange,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const inputValue = useMemo(() => {
    if (filter === 'month') return toMonthValue(selectedDate);
    if (filter === 'year') return toDateValue(selectedDate);
    // day
    return toDayValue(selectedDate);
  }, [filter, selectedDate]);

  const handleDateChange = (value: string) => {
    if (!value) return;

    let nextDate: Date;

    if (filter === 'month') {
      nextDate = new Date(`${value}-01T00:00:00Z`);
    } else {
        // 'day' and 'year' – use the chosen full date
      nextDate = new Date(`${value}T00:00:00Z`);
    }

    if (!Number.isNaN(nextDate.getTime())) {
      onDateChange(nextDate);
    }
    };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-md shadow-black/5">
      <div className="flex flex-wrap gap-2">
        {([
          ['day', 'Day'],
          ['month', 'Month'],
          ['year', 'Year'],
        ] as [HostAnalyticsFilter, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={twMerge(
              'rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100 hover:shadow-md',
                filter === value
                ? 'border-black bg-black text-white shadow-md hover:bg-black'
                : 'border-neutral-200 text-neutral-700',
            )}
            >
            {label}
            </button>
        ))}
        </div>


     <label className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-xs font-semibold text-neutral-600 shadow-sm transition hover:bg-neutral-100 hover:shadow-md">
        <span
          className="cursor-pointer text-[13px] font-semibold text-neutral-700 hover:text-neutral-900"
          onClick={() => {
            const input = dateInputRef.current;
            if (!input) return;

            if (typeof input.showPicker === 'function') {
              input.showPicker();
            } else {
              input.focus();
            }
          }}
        >
          {filter === 'day'
            ? 'Select day'
            : filter === 'month'
            ? 'Select month'
            : 'Select year'}
        </span>
        <input
          ref={dateInputRef}
          type={filter === 'month' ? 'month' : 'date'}
          value={inputValue}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-[0_1px_4px_rgba(0,0,0,0.08)] outline-none transition hover:bg-neutral-50 focus:border-black focus:ring-2 focus:ring-black/10"
        />
      </label>
    </div>
  );
};

export default FilterHostAnalytics;