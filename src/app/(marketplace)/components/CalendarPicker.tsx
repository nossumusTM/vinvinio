// CalendarPicker.tsx
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

interface CalendarPickerProps {
  selectedMonth: number;
  selectedYear: number;
  yearOptions: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  placement?: 'up' | 'down'; // 👈 NEW
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedMonth,
  selectedYear,
  yearOptions,
  onMonthChange,
  onYearChange,
  placement = 'down', // default behavior everywhere else
}) => {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const monthListRef = useRef<HTMLDivElement | null>(null);
  const yearListRef = useRef<HTMLDivElement | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (wrapperRef.current && target && !wrapperRef.current.contains(target)) {
        setIsMonthOpen(false);
        setIsYearOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMonthOpen && monthListRef.current) {
      const container = monthListRef.current;
      const active = container.querySelector<HTMLElement>('[data-selected="true"]');
      if (active) {
        const offset =
          active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
        container.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }
  }, [isMonthOpen, selectedMonth]);

  useEffect(() => {
    if (isYearOpen && yearListRef.current) {
      const container = yearListRef.current;
      const active = container.querySelector<HTMLElement>('[data-selected="true"]');
      if (active) {
        const offset =
          active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
        container.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }
  }, [isYearOpen, selectedYear]);

  const currentYear = new Date().getFullYear();

  const extendedYearOptions = useMemo(() => {
    if (yearOptions && yearOptions.length) {
      const rawMin = Math.min(...yearOptions);
      const max = Math.max(...yearOptions);
      const min = Math.max(rawMin, 2026); // 👈 don't go below 2026
      const extendTo = Math.max(max, currentYear + 5, 2026);

      const result: number[] = [];
      for (let y = min; y <= extendTo; y++) {
        result.push(y);
      }
      return result;
    }

    const start = Math.max(currentYear - 5, 2026); // 👈 min 2026 even without yearOptions
    return Array.from({ length: 11 }, (_, i) => start + i);
  }, [yearOptions, currentYear]);

  const dropdownPositionClass =
    placement === 'up'
      ? 'bottom-[calc(100%+8px)] origin-bottom'
      : 'top-[calc(100%+8px)] origin-top';

  return (
    <div ref={wrapperRef} className="flex flex-row gap-3">
      {/* Month */}
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setIsMonthOpen((prev) => {
              const next = !prev;
              if (next) setIsYearOpen(false); // 👈 close year when month opens
              return next;
            })
          }
          className="flex w-full items-center justify-center rounded-xl shadow-md bg-white px-3 py-2 text-sm font-medium text-neutral-900"
        >
          <span>{months[selectedMonth] ?? 'Month'}</span>
        </button>

        {isMonthOpen && (
          <div
            ref={monthListRef}
            className={`
              absolute
              ${dropdownPositionClass}
              left-0
              z-20
              w-full
              rounded-2xl
              border border-neutral-200
              bg-white
              shadow-lg
              max-h-60
              overflow-y-auto
            `}
          >
            {months.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onMonthChange(index);
                  setIsMonthOpen(false);
                }}
                data-selected={index === selectedMonth ? 'true' : undefined}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                  index === selectedMonth ? 'bg-neutral-50 font-semibold' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Year */}
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setIsYearOpen((prev) => {
              const next = !prev;
              if (next) setIsMonthOpen(false); // 👈 close month when year opens
              return next;
            })
          }
          className="flex w-full items-center justify-center rounded-xl shadow-md bg-white px-3 py-2 text-sm font-medium text-neutral-900"
        >
          <span>{selectedYear}</span>
        </button>

        {isYearOpen && (
          <div
            ref={yearListRef}
            className={`
              absolute
              ${dropdownPositionClass}
              left-0
              z-20
              w-full
              rounded-2xl
              border border-neutral-200
              bg-white
              shadow-lg
              max-h-60
              overflow-y-auto
            `}
          >
            {extendedYearOptions.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  onYearChange(year);
                  setIsYearOpen(false);
                }}
                data-selected={year === selectedYear ? 'true' : undefined}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                  year === selectedYear ? 'bg-neutral-50 font-semibold' : ''
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPicker;
