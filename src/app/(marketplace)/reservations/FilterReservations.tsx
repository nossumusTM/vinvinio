'use client';
import { useEffect, useRef } from 'react';
import MonthYearPicker from '../components/MonthYearPicker';
import TimeInput from '@/app/(marketplace)/components/inputs/TimeInput';
import NeumorphicToggle from '@/app/(marketplace)/components/inputs/NeumorphicToggle';

interface FilterReservationsProps {
  activeKeyword?: string | null;
  isLoading?: boolean;
  timeValue: string;
  isTimeEnabled: boolean;
  selectedYear: number;
  yearOptions: number[];
  selectedMonth: number;
  onMonthChange: (month: number) => void;
  onTimeToggle: (isEnabled: boolean) => void;
  onTimeChange: (value: string) => void;
  onYearChange: (year: number) => void;
  onFilter: () => void;
  onReset: () => void;
  onClose: () => void;
}

const FilterReservations: React.FC<FilterReservationsProps> = ({
  activeKeyword,
  isLoading,
  timeValue,
  isTimeEnabled,
  selectedYear,
  yearOptions,
  selectedMonth,
  onMonthChange,
  onTimeToggle,
  onTimeChange,
  onYearChange,
  onFilter,
  onReset,
  onClose,
}) => {
  const isActive = activeKeyword === 'reservations';
  const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const node = containerRef.current;
      if (!node) return;

      if (!node.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [onClose]);


  return (
    <div
      ref={containerRef}
      className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-neutral-100/80 shadow-md p-5 space-y-6"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Booking filter
        </p>
        <p className="text-base font-semibold text-neutral-900">
          Pick when this booking happens
        </p>
        <p className="text-sm text-neutral-600">
          Select a month, preferred hour, and year to pull matching reservations.
        </p>
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
            placement="up"
          />
        </div>

        {/* Time input */}
        
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm flex flex-col gap-4">
        <NeumorphicToggle
            id="reservation-filter-enable-time"
            label="Filter by time"
            checked={isTimeEnabled}
            onChange={onTimeToggle}
          />
          <TimeInput
            id="reservation-filter-time"
            label=""
            value={timeValue}
            disabled={!isTimeEnabled}
            onChange={onTimeChange}
            helperText="Choose a month and year, then optionally filter by a preferred hour."
          />
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
            <span
              className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            ></span>
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
