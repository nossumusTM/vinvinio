'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

interface MonthYearPickerProps {
  selectedMonth: number; // 0–11
  selectedYear: number;
  yearOptions: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  selectedMonth,
  selectedYear,
  yearOptions,
  onMonthChange,
  onYearChange,
}) => {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Month &amp; year
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Month dropdown */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Month
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsMonthOpen((prev) => !prev);
                setIsYearOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm hover:bg-neutral-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            >
              <span>{MONTHS[selectedMonth] ?? 'Month'}</span>
              <FiChevronDown
                className={`h-4 w-4 text-neutral-500 transition-transform ${
                  isMonthOpen ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </button>

            <AnimatePresence>
              {isMonthOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  transition={{ duration: 0.16 }}
                  className="absolute z-30 mt-2 w-full origin-top overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
                >
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {MONTHS.map((label, index) => (
                      <li key={label}>
                        <button
                          type="button"
                          onClick={() => {
                            onMonthChange(index);
                            setIsMonthOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-sm ${
                            selectedMonth === index
                              ? 'bg-neutral-900 text-white'
                              : 'text-neutral-800 hover:bg-neutral-50'
                          }`}
                        >
                          <span>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Year dropdown */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Year
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsYearOpen((prev) => !prev);
                setIsMonthOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm hover:bg-neutral-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
            >
              <span>{selectedYear}</span>
              <FiChevronDown
                className={`h-4 w-4 text-neutral-500 transition-transform ${
                  isYearOpen ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </button>

            <AnimatePresence>
              {isYearOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                  transition={{ duration: 0.16 }}
                  className="absolute z-30 mt-2 w-full origin-top overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl"
                >
                  <ul className="max-h-56 overflow-y-auto py-1">
                    {yearOptions.map((year) => (
                      <li key={year}>
                        <button
                          type="button"
                          onClick={() => {
                            onYearChange(year);
                            setIsYearOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-sm ${
                            selectedYear === year
                              ? 'bg-neutral-900 text-white'
                              : 'text-neutral-800 hover:bg-neutral-50'
                          }`}
                        >
                          <span>{year}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthYearPicker;