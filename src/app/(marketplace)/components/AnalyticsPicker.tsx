'use client';

import { useMemo, useState, useEffect } from 'react';
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
  const firstDay = new Date(Date.UTC(year, month, 1));
  const firstWeekday = firstDay.getUTCDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

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
  // ---------- DAY MODE ----------
  if (filter === 'day') {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [viewYear, setViewYear] = useState(selectedDate.getUTCFullYear());
    const [viewMonth, setViewMonth] = useState(selectedDate.getUTCMonth());

    // keep calendar view in sync if selectedDate changes from outside
    useEffect(() => {
      setViewYear(selectedDate.getUTCFullYear());
      setViewMonth(selectedDate.getUTCMonth());
    }, [selectedDate]);

    const handleStep = (delta: number) => {
      const next = new Date(selectedDate);
      next.setUTCDate(next.getUTCDate() + delta);
      onDateChange(next);
    };

    const handleMonthStep = (delta: number) => {
      const nextMonth = viewMonth + delta;
      const nextDate = new Date(Date.UTC(viewYear, nextMonth, 1));
      setViewYear(nextDate.getUTCFullYear());
      setViewMonth(nextDate.getUTCMonth());
    };

    const monthLabel = useMemo(
      () =>
        new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString(
          'en-US',
          { month: 'long', year: 'numeric' },
        ),
      [viewYear, viewMonth],
    );

    const cells = useMemo(
      () => buildMonthCells(viewYear, viewMonth),
      [viewYear, viewMonth],
    );

    const selectedDay = selectedDate.getUTCDate();
    const selectedYear = selectedDate.getUTCFullYear();
    const selectedMonth = selectedDate.getUTCMonth();

    const isSameMonthView =
      selectedYear === viewYear && selectedMonth === viewMonth;

    const weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <div className="group relative flex flex-col select-none gap-2 rounded-xl border border-neutral-100 bg-white px-3 py-3 text-xs font-semibold text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_40px_rgba(0,0,0,0.06)]">
        <span className="text-[13px] font-semibold text-neutral-700">
          Select day
        </span>

        {/* compact header with stepper */}
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIsCalendarOpen((open) => !open)}
            className="px-2 text-[13px] font-semibold text-neutral-900 underline-offset-2 hover:underline"
          >
            {formatDayLabel(selectedDate)}
          </button>
          <button
            type="button"
            onClick={() => handleStep(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            ›
          </button>
        </div>

        {/* inline calendar popover */}
        {isCalendarOpen && (
          <div
            className={`mt-3 rounded-xl border border-neutral-200 bg-white p-3 text-[11px] shadow-[0_16px_40px_rgba(0,0,0,0.14)] ${
              placement === 'up' ? 'origin-bottom' : 'origin-top'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleMonthStep(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
              >
                ‹
              </button>
              <span className="px-2 text-[12px] font-semibold text-neutral-900">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => handleMonthStep(1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
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
                      const next = new Date(
                        Date.UTC(viewYear, viewMonth, day),
                      );
                      onDateChange(next);
                      // close after selection
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
          </div>
        )}
      </div>
    );
  }

  // ---------- MONTH / YEAR MODE (reuse CalendarPicker) ----------
      // ---------- MONTH / YEAR MODE: same stepper pattern ----------
  const safeDate =
    selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())
      ? selectedDate
      : new Date();

  const selectedMonth = safeDate.getUTCMonth();
  const selectedYear = safeDate.getUTCFullYear();
  const selectedDay = safeDate.getUTCDate();

  const handleMonthStep = (delta: number) => {
    const next = new Date(Date.UTC(selectedYear, selectedMonth + delta, selectedDay));
    onDateChange(next);
  };

  const handleYearStep = (delta: number) => {
    const next = new Date(Date.UTC(selectedYear + delta, selectedMonth, selectedDay));
    onDateChange(next);
  };

  const monthLabel = new Date(Date.UTC(selectedYear, selectedMonth, 1)).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' },
  );

  return (
    <div className="group flex flex-col select-none gap-2 rounded-xl border border-neutral-100 bg-white px-3 py-3 text-xs font-semibold text-neutral-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_16px_40px_rgba(0,0,0,0.06)]">
      <span className="text-[13px] font-semibold text-neutral-700">
        {filter === 'month' ? 'Select month' : 'Select year'}
      </span>

      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-2 py-1 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={() => (filter === 'month' ? handleMonthStep(-1) : handleYearStep(-1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          ‹
        </button>

        <span className="px-2 text-[13px] font-semibold text-neutral-900">
          {filter === 'month' ? monthLabel : selectedYear}
        </span>

        <button
          type="button"
          onClick={() => (filter === 'month' ? handleMonthStep(1) : handleYearStep(1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default AnalyticsPicker;
