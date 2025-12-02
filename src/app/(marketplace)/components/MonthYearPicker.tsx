// MonthYearPicker.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiArrowDownSFill } from "react-icons/ri";

interface MonthYearPickerProps {
  selectedMonth: number;
  selectedYear: number;
  yearOptions: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  placement?: 'up' | 'down';
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedMonth,
  selectedYear,
  yearOptions,
  onMonthChange,
  onYearChange,
  placement = 'down',
}) => {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const monthListRef = useRef<HTMLDivElement | null>(null);
  const yearListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsMonthOpen(false);
        setIsYearOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // scroll to active month
  useEffect(() => {
    if (!isMonthOpen || !monthListRef.current) return;
    const active = monthListRef.current.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [isMonthOpen, selectedMonth]);

  // scroll to active year
  useEffect(() => {
    if (!isYearOpen || !yearListRef.current) return;
    const active = yearListRef.current.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [isYearOpen, selectedYear]);

  const currentYear = new Date().getFullYear();

  const extendedYearOptions = useMemo(() => {
    if (yearOptions && yearOptions.length) {
      const min = Math.min(...yearOptions);
      const max = Math.max(...yearOptions);
      const extendTo = Math.max(max, currentYear + 5);

      const result: number[] = [];
      for (let y = min; y <= extendTo; y++) {
        result.push(y);
      }
      return result;
    }

    const start = currentYear - 5;
    return Array.from({ length: 11 }, (_, i) => start + i);
  }, [yearOptions, currentYear]);

  const dropdownPositionClass =
    placement === 'up'
      ? 'bottom-[calc(100%+8px)] origin-bottom'
      : 'top-[calc(100%+8px)] origin-top';

  const dropdownMotion = {
    initial: {
      opacity: 0,
      y: placement === 'up' ? 8 : -8,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: placement === 'up' ? 8 : -8,
      scale: 0.98,
    },
  } as const;

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {/* Month */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsMonthOpen((prev) => !prev);
            setIsYearOpen(false);
          }}
          className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900"
        >
          <span>{months[selectedMonth] ?? 'Month'}</span>
            <RiArrowDownSFill className="h-4 w-4 text-neutral-500" />
        </button>

        <AnimatePresence>
          {isMonthOpen && (
            <motion.div
              key="month-dropdown"
              ref={monthListRef}
              initial={dropdownMotion.initial}
              animate={dropdownMotion.animate}
              exit={dropdownMotion.exit}
              transition={{ duration: 0.15, ease: 'easeOut' }}
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
                  data-active={index === selectedMonth || undefined}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                    index === selectedMonth ? 'bg-neutral-50 font-semibold' : ''
                  }`}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Year */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsYearOpen((prev) => !prev);
            setIsMonthOpen(false);
          }}
          className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900"
        >
          <span>{selectedYear}</span>
            <RiArrowDownSFill className="h-4 w-4 text-neutral-500" />
        </button>

        <AnimatePresence>
          {isYearOpen && (
            <motion.div
              key="year-dropdown"
              initial={dropdownMotion.initial}
              ref={yearListRef}
              animate={dropdownMotion.animate}
              exit={dropdownMotion.exit}
              transition={{ duration: 0.15, ease: 'easeOut' }}
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
                  data-active={year === selectedYear || undefined}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                    year === selectedYear ? 'bg-neutral-50 font-semibold' : ''
                  }`}
                >
                  {year}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MonthYearPicker;
