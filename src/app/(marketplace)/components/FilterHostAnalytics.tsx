'use client';

import { useMemo, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import CalendarPicker from './CalendarPicker'; // optional now
import AnalyticsPicker from './AnalyticsPicker';

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

    const openNativePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    const anyInput = input as any;

    if (typeof anyInput.showPicker === 'function') {
      try {
        anyInput.showPicker(); // may throw NotAllowedError if browser thinks it's not a user gesture
      } catch (err) {
        console.warn('[FilterHostAnalytics] showPicker blocked, falling back to focus', err);
        input.focus();
      }
    } else {
      input.focus();
    }
  };

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

      const selectedMonth = selectedDate.getUTCMonth();
  const selectedYear = selectedDate.getUTCFullYear();

  const yearOptions = useMemo(
    () => [selectedYear],
    [selectedYear],
  );

  const handleMonthYearChange = (month: number, year: number) => {
    // keep same day, adjust month/year
    const nextDate = new Date(Date.UTC(year, month, selectedDate.getUTCDate()));
    onDateChange(nextDate);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-md shadow-black/5">
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
      
      <AnalyticsPicker
        filter={filter}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        placement="down"
      />

    </div>
  );
};

export default FilterHostAnalytics;