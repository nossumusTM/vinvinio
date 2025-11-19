'use client';

import SearchCalendar from '@/app/(marketplace)/components/inputs/SearchCalendar';
import type { Range, RangeKeyDict } from 'react-date-range';

interface FilterReservationsProps {
  activeKeyword?: string | null;
  isLoading?: boolean;
  range: Range;
  timeValue: string;
  selectedYear: number;
  yearOptions: number[];
  onDateChange: (value: RangeKeyDict) => void;
  onTimeChange: (value: string) => void;
  onYearChange: (year: number) => void;
  onFilter: () => void;
  onReset: () => void;
}

const FilterReservations: React.FC<FilterReservationsProps> = ({
  activeKeyword,
  isLoading,
  range,
  timeValue,
  selectedYear,
  yearOptions,
  onDateChange,
  onTimeChange,
  onYearChange,
  onFilter,
  onReset,
}) => {
  const isActive = activeKeyword === 'reservations';

  return (
    <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-white shadow-md p-5 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Booking filters</p>
        <p className="text-base font-semibold text-neutral-900">Match requests to a moment in your calendar</p>
        <p className="text-sm text-neutral-600">Pick a date, time, and year to only show the reservations that fit.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <SearchCalendar value={range} onChange={onDateChange} className="bg-white/95" />

        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="reservation-filter-time" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Preferred time
            </label>
            <input
              id="reservation-filter-time"
              type="time"
              value={timeValue}
              onChange={(event) => onTimeChange(event.target.value)}
              className="rounded-2xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="reservation-filter-year" className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Year
            </label>
            <select
              id="reservation-filter-year"
              value={selectedYear}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
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
          Filter Reservations
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

export default FilterReservations;