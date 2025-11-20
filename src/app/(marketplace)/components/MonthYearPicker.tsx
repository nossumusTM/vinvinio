// MonthYearPicker.tsx
'use client';

import { useState } from 'react';

interface MonthYearPickerProps {
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

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedMonth,
  selectedYear,
  yearOptions,
  onMonthChange,
  onYearChange,
  placement = 'down', // default behavior everywhere else
}) => {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const dropdownPositionClass =
    placement === 'up'
      ? 'bottom-[calc(100%+8px)] origin-bottom'
      : 'top-[calc(100%+8px)] origin-top';

  return (
    <div className="flex flex-col gap-3">
      {/* Month */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMonthOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900"
        >
          <span>{months[selectedMonth] ?? 'Month'}</span>
          <span className="text-xs text-neutral-500">▼</span>
        </button>

        {isMonthOpen && (
          <div
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
          onClick={() => setIsYearOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900"
        >
          <span>{selectedYear}</span>
          <span className="text-xs text-neutral-500">▼</span>
        </button>

        {isYearOpen && (
          <div
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
            {yearOptions.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  onYearChange(year);
                  setIsYearOpen(false);
                }}
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

export default MonthYearPicker;
