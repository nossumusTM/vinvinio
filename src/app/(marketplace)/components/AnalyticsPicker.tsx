'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarPicker from './CalendarPicker';
import type { HostAnalyticsFilter } from './FilterHostAnalytics';

interface AnalyticsPickerProps {
  filter: HostAnalyticsFilter;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  placement?: 'up' | 'down';
}

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// build a simple month grid: null = empty cell, number = day of month
const buildMonthCells = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(d);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

const AnalyticsPicker: React.FC<AnalyticsPickerProps> = ({
  filter,
  selectedDate,
  onDateChange,
  placement = 'up',
}) => {
  const safeDate =
    selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())
      ? selectedDate
      : new Date();

  // shared view state for all modes
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewYear, setViewYear] = useState(safeDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(safeDate.getMonth());
  const selectedDay = safeDate.getDate();

  // keep view in sync when parent changes selectedDate
  useEffect(() => {
    setViewYear(safeDate.getFullYear());
    setViewMonth(safeDate.getMonth());
  }, [safeDate]);

  // values reused in both modes (no hooks below this point)
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' },
  );
  const cells = buildMonthCells(viewYear, viewMonth);
  const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // ---------- DAY MODE ----------
  if (filter === 'day') {
    const calendarVariants = {
      hidden: { opacity: 0, y: -8, scale: 0.98 },
      visible: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.98 },
    };

    const handleStep = (delta: number) => {
      const next = new Date(safeDate);
      next.setDate(next.getDate() + delta);
      onDateChange(next);
    };

    const handleMonthStep = (delta: number) => {
      const nextMonth = viewMonth + delta;
      const nextDate = new Date(viewYear, nextMonth, 1);
      setViewYear(nextDate.getFullYear());
      setViewMonth(nextDate.getMonth());
    };

    const selectedYear = safeDate.getFullYear();
    const selectedMonth = safeDate.getMonth();
    const isSameMonthView =
      selectedYear === viewYear && selectedMonth === viewMonth;

    return (
      <div className="group relative flex flex-col select-none gap-2 rounded-xl border border-neutral-100 bg-white px-3 py-3 text-xs font-semibold text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_40px_rgba(0,0,0,0.06)]">
        <span className="text-[13px] font-semibold text-neutral-700">
          Select day
        </span>

        {/* compact header with stepper */}
        <div className="flex items-center justify-between rounded-lg shadow-inner bg-white px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full shadow-md bg-neutral-50 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIsCalendarOpen((open) => !open)}
            className="px-2 text-[13px] font-semibold text-neutral-900 underline-offset-2 hover:underline"
          >
            {formatDayLabel(safeDate)}
          </button>
          <button
            type="button"
            onClick={() => handleStep(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full shadow-md bg-neutral-50 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            ›
          </button>
        </div>

        {/* inline calendar popover */}
        <AnimatePresence>
          {isCalendarOpen && (
            <motion.div
              key="day-calendar"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl shadow-inner bg-white p-3 text-[11px] shadow-[0_16px_40px_rgba(0,0,0,0.14)] origin-top"
            >
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleMonthStep(-1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full shadow-inner bg-neutral-50 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  ‹
                </button>
                <span className="px-2 text-[12px] font-semibold text-neutral-900">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={() => handleMonthStep(1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full shadow-inner bg-neutral-50 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  ›
                </button>
              </div>

              {/* weekday header */}
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-neutral-500">
                {weekDayLabels.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* days grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                {cells.map((day, idx) => {
                  if (day == null) {
                    return (
                      <div
                        key={idx}
                        className="h-7 w-7 text-[10px] text-transparent"
                      >
                        ·
                      </div>
                    );
                  }

                  const isSelected =
                    isSameMonthView && day === selectedDay;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const next = new Date(viewYear, viewMonth, day);
                        onDateChange(next);
                        setIsCalendarOpen(false);
                      }}
                      className={[
                        'flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition',
                        isSelected
                          ? 'bg-black text-white'
                          : 'bg-neutral-50 text-neutral-800 hover:bg-neutral-100',
                      ].join(' ')}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ---------- MONTH / YEAR MODE: stepper for month / year ----------
  const handleMonthStep = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, selectedDay);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    onDateChange(next);
  };

  const handleYearStep = (delta: number) => {
    const next = new Date(viewYear + delta, viewMonth, selectedDay);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    onDateChange(next);
  };

  return (
    <div className="group flex flex-col select-none gap-2 rounded-xl border border-neutral-100 bg-white px-3 py-3 text-xs font-semibold text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_40px_rgba(0,0,0,0.06)]">
      <span className="text-[13px] font-semibold text-neutral-700">
        {filter === 'month' ? 'Select month' : 'Select year'}
      </span>

      <div className="flex items-center justify-between rounded-lg shadow-inner bg-white px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() =>
            filter === 'month' ? handleMonthStep(-1) : handleYearStep(-1)
          }
          className="flex h-7 w-7 items-center justify-center rounded-full shadow-md bg-neutral-50 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          ‹
        </button>

        <span className="px-2 text-[13px] font-semibold text-neutral-900">
          {filter === 'month' ? monthLabel : viewYear}
        </span>

        <button
          type="button"
          onClick={() =>
            filter === 'month' ? handleMonthStep(1) : handleYearStep(1)
          }
          className="flex h-7 w-7 items-center justify-center rounded-full shadow-md bg-neutral-50 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          ›
        </button>
      </div>
    </div>
  );
};
export default AnalyticsPicker;
