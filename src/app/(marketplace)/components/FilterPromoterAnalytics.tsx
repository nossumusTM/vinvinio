'use client';

import FilterHostAnalytics, { HostAnalyticsFilter } from './FilterHostAnalytics';

import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

import AnalyticsPicker from './AnalyticsPicker';

export type PromoterAnalyticsFilter = 'day' | 'month' | 'year';

interface FilterPromoterAnalyticsProps {
  filter: PromoterAnalyticsFilter;
  selectedDate: Date;
  onFilterChange: (filter: PromoterAnalyticsFilter) => void;
  onDateChange: (date: Date) => void;
  yearOptions?: number[];
}

const FilterPromoterAnalytics: React.FC<FilterPromoterAnalyticsProps> = ({
  filter,
  selectedDate,
  onFilterChange,
  onDateChange,
  yearOptions,
}) => {

  const handleDateChange = (date: Date) => {
    if (Number.isNaN(date.getTime())) return;

    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    onDateChange(utcDate);
  };

  const allowedYears = useMemo(
    () => (yearOptions?.length ? yearOptions : [selectedDate.getUTCFullYear()]),
    [selectedDate, yearOptions],
  );
  
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-md shadow-black/5">
      <div className="flex flex-wrap gap-2">
        {([
          ['day', 'Day'],
          ['month', 'Month'],
          ['year', 'Year'],
        ] as [PromoterAnalyticsFilter, string][]).map(([value, label]) => (
          <button
            key={value}
            type="button"
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
        onDateChange={handleDateChange}
        placement="down"
        yearOptions={allowedYears}
      />
    </div>
  );
};

export default FilterPromoterAnalytics;