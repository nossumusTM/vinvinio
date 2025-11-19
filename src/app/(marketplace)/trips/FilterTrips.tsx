'use client';

import SearchCalendar from '@/app/(marketplace)/components/inputs/SearchCalendar';
import type { Range, RangeKeyDict } from 'react-date-range';
import MonthYearPicker from '../components/MonthYearPicker';

interface FilterTripsProps {
  activeKeyword?: string | null;
  isLoading?: boolean;
  timeValue: string;
  selectedYear: number;
  yearOptions: number[];
  selectedMonth: number;                 // 👈 NEW
  onMonthChange: (month: number) => void; // 👈 NEW
  onTimeChange: (value: string) => void;
  onYearChange: (year: number) => void;
  onFilter: () => void;
  onReset: () => void;
}

const FilterTrips: React.FC<FilterTripsProps> = ({
  activeKeyword,
  isLoading,
  timeValue,
  selectedYear,
  yearOptions,
  selectedMonth,
  onMonthChange,
  onTimeChange,
  onYearChange,
  onFilter,
  onReset,
}) => {
  const isActive = activeKeyword === 'activities';

  return (
    <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 shadow-md p-5 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Activities filter</p>
        <p className="text-base font-semibold text-neutral-900">Pick the moment you want to relive</p>
        <p className="text-sm text-neutral-600">Select a date, preferred hour, and year to pull matching activities.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr,1fr]">
        {/* Month & Year picker */}
        <div className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm">
          <MonthYearPicker
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            yearOptions={yearOptions}
            onMonthChange={onMonthChange}
            onYearChange={onYearChange}
          />
        </div>

        {/* Time input */}
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="trip-filter-time"
              className="text-xs font-semibold uppercase tracking-wide text-neutral-500"
            >
              Preferred time
            </label>
            <input
              id="trip-filter-time"
              type="time"
              value={timeValue}
              onChange={(event) => onTimeChange(event.target.value)}
              className="rounded-2xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            />
            <p className="text-[11px] text-neutral-500">
              We’ll look for activities around this hour in the chosen month.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          type="button"
          onClick={onFilter}
          disabled={isLoading}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-black ${
            isActive ? 'bg-black text-white' : 'bg-neutral-900/90 text-white hover:bg-black'
          } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isLoading && (
            <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" aria-hidden="true"></span>
          )}
          Filter Activities
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-neutral-700 bg-white shadow-sm md:shadow-md border border-neutral-200 hover:bg-neutral-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-black disabled:opacity-60"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default FilterTrips;