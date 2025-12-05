'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { DateRange, Range, RangeKeyDict } from 'react-date-range';
import clsx from 'clsx';

import { BiSolidLeftArrow, BiSolidRightArrow } from 'react-icons/bi';
import { differenceInCalendarDays } from 'date-fns';

import { AnimatePresence, motion } from 'framer-motion';
import CalendarPicker from '../CalendarPicker';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

export interface SearchCalendarProps {
  value: Range;
  onChange: (value: RangeKeyDict) => void;
  minDate?: Date;
  disabledDates?: Date[];
  className?: string;
}

const SearchCalendar: React.FC<SearchCalendarProps> = ({
  value,
  onChange,
  minDate,
  disabledDates = [],
  className,
}) => {
  const ranges = useMemo(() => [value], [value]);

  const [visibleMonthDate, setVisibleMonthDate] = useState<Date>(value.startDate ?? new Date());
  const [navDirection, setNavDirection] = useState<1 | -1>(1);

  const currentYear = visibleMonthDate.getFullYear();

  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, i) => currentYear - 5 + i),
    [currentYear],
  );

  useEffect(() => {
    if (value.startDate) {
      setVisibleMonthDate(value.startDate);
    }
  }, [value.startDate]);

  const syncSelectionToMonth = useCallback(
    (targetMonthDate: Date) => {
      const baseStart = value.startDate ?? value.endDate ?? new Date();
      const baseDay = baseStart.getDate();
      const rangeLength =
        value.startDate && value.endDate
          ? differenceInCalendarDays(value.endDate, value.startDate)
          : 0;

      const lastDayOfTargetMonth = new Date(
        targetMonthDate.getFullYear(),
        targetMonthDate.getMonth() + 1,
        0,
      ).getDate();

      const clampedDay = Math.min(baseDay, lastDayOfTargetMonth);
      const newStartDate = new Date(
        targetMonthDate.getFullYear(),
        targetMonthDate.getMonth(),
        clampedDay,
      );

      const newEndDate = value.endDate
        ? new Date(newStartDate.getFullYear(), newStartDate.getMonth(), newStartDate.getDate() + rangeLength)
        : newStartDate;

      onChange({
        selection: {
          startDate: newStartDate,
          endDate: newEndDate,
          key: 'selection',
        },
      });
    },
    [onChange, value.endDate, value.startDate],
  );

  const handlePrevMonth = () => {
    const nextMonth = new Date(visibleMonthDate);
    nextMonth.setMonth(visibleMonthDate.getMonth() - 1);
    setNavDirection(-1);
    setVisibleMonthDate(nextMonth);
    syncSelectionToMonth(nextMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(visibleMonthDate);
    nextMonth.setMonth(visibleMonthDate.getMonth() + 1);
    setNavDirection(1);
    setVisibleMonthDate(nextMonth);
    syncSelectionToMonth(nextMonth);
  };

  const monthTransitionVariants = {
    initial: (dir: 1 | -1) => ({ opacity: 0, x: dir > 0 ? 14 : -14 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.18 } },
    exit: (dir: 1 | -1) => ({ opacity: 0, x: dir > 0 ? -14 : 14, transition: { duration: 0.18 } }),
  };

  const monthKey = visibleMonthDate.toISOString().slice(0, 7);

  return (
    <div
      className={clsx(
        'relative w-full rounded-[24px] bg-white/90 p-2 shadow-sm shadow-black/5',
        className,
      )}
    >

      <div className="mb-3 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm text-neutral-700 shadow-md transition hover:bg-neutral-100"
        >
          <BiSolidLeftArrow />
        </button>

        <CalendarPicker
          selectedMonth={visibleMonthDate.getMonth()}
          selectedYear={visibleMonthDate.getFullYear()}
          yearOptions={yearOptions}
          onMonthChange={(month) => {
            setVisibleMonthDate((prev) => {
              const next = new Date(prev);
              next.setMonth(month);
              return next;
            });
          }}
          onYearChange={(year) => {
            setVisibleMonthDate((prev) => {
              const next = new Date(prev);
              next.setFullYear(year);
              return next;
            });
          }}
          placement="down"
        />

        <button
          type="button"
          onClick={handleNextMonth}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm text-neutral-700 shadow-md transition hover:bg-neutral-100"
        >
          <BiSolidRightArrow />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthKey}
          custom={navDirection}
          variants={monthTransitionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <DateRange
            onChange={onChange}
            moveRangeOnFirstSelection={false}
            ranges={ranges}
            minDate={minDate ?? new Date()}
            direction="vertical"
            showDateDisplay={false}
            fixedHeight
            rangeColors={['#09090b']}
            disabledDates={disabledDates}
            weekdayDisplayFormat="EE"
            shownDate={visibleMonthDate}
            showMonthAndYearPickers={false}
            showMonthArrow={false}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SearchCalendar;