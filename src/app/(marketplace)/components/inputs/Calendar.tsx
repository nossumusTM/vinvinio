'use client';

import { Calendar as DatePicker, DateRange } from 'react-date-range';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BiSolidLeftArrow, BiSolidRightArrow } from "react-icons/bi";
import CalendarPicker from '../CalendarPicker';
import { format } from 'date-fns';
import {
  DEFAULT_TIME_SLOTS,
  ListingAvailabilityRules,
  normalizeAvailabilityRules,
  normalizeTimeSlot,
} from '@/app/(marketplace)/utils/timeSlots';

import { Range, RangeKeyDict } from 'react-date-range';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { AnimatePresence, motion } from 'framer-motion';

interface ReservationSlot {
  date: string;
  time: string;
}

interface CalendarProps {
  value: Range; // ✅ use Range type
  onChange: (value: { selection: Range }) => void; // ✅ updated
  selectedTime?: string | null;
  onTimeChange?: (time: string | null, meta?: { userInitiated?: boolean }) => void;
  bookedSlots?: ReservationSlot[];
  availabilityRules?: ListingAvailabilityRules | null;
  hoursInAdvance?: number;
  /** Force-open the time dropdown to nudge users to confirm time */
  forceOpenTimes?: boolean;
  /** Optional reminder text shown above the time list */
  reminderText?: string;
  /** Callback once reminder has been surfaced */
  onReminderDisplayed?: () => void;
}

const normalizeTime = normalizeTimeSlot;

const getDateKey = (date: Date | string) =>
  typeof date === 'string' ? date.slice(0, 10) : format(date, 'yyyy-MM-dd');

const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  selectedTime,
  onTimeChange,
  bookedSlots = [],
  availabilityRules,
  hoursInAdvance,
  forceOpenTimes,
  reminderText,
  onReminderDisplayed,
}) => {
  const selectedDateKey = value.startDate ? format(value.startDate, 'yyyy-MM-dd') : '';

  const normalizedAvailability = useMemo(
    () => normalizeAvailabilityRules(availabilityRules) ?? null,
    [availabilityRules],
  );


  const userHasPickedTime = useRef(false);
  const [showTimes, setShowTimes] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'single' | 'multiple'>(
    value.endDate && value.startDate && value.endDate !== value.startDate ? 'multiple' : 'single',
  );
  const [showReminder, setShowReminder] = useState(false);

  const getBaseTimesForDate = useCallback(
    (targetDate: Date | null) => {
      if (!targetDate) {
        return (normalizedAvailability?.defaultTimes ?? Array.from(DEFAULT_TIME_SLOTS)).map(normalizeTime);
      }

      const dateKey = getDateKey(targetDate);
      const monthKey = format(targetDate, 'yyyy-MM');
      const yearKey = format(targetDate, 'yyyy');
      const weekdayKey = targetDate.getDay().toString();

      const prioritized =
        normalizedAvailability?.specificDates?.[dateKey] ??
        normalizedAvailability?.months?.[monthKey] ??
        normalizedAvailability?.years?.[yearKey] ??
        normalizedAvailability?.daysOfWeek?.[weekdayKey] ??
        normalizedAvailability?.defaultTimes;

      const fallback = prioritized ?? Array.from(DEFAULT_TIME_SLOTS);
      const unique = Array.from(new Set(fallback.map(normalizeTime)));
      return unique;
    },
    [normalizedAvailability],
  );

  const availableTimesForSelectedDate = useMemo(
    () => getBaseTimesForDate(value.startDate ?? null),
    [getBaseTimesForDate, value.startDate],
  );

  const bookedTimesForDate = useMemo(() => {
    return bookedSlots
      .filter((slot) => slot.date === selectedDateKey)
      .map((slot) => slot.time);
  }, [bookedSlots, selectedDateKey]);

  const leadTimeMs = Math.max(0, Number(hoursInAdvance ?? 0)) * 60 * 60 * 1000;

  const isSlotTooSoon = useCallback(
    (targetDate: Date | null, time: string) => {
      if (!targetDate) return false;

      const [hour, minute] = time.split(':').map(Number);
      const slotDate = new Date(targetDate);
      slotDate.setHours(hour, minute, 0, 0);

      const now = new Date();
      if (slotDate < now) return true;

      return leadTimeMs > 0 && slotDate.getTime() - now.getTime() < leadTimeMs;
    },
    [leadTimeMs],
  );

  const disabledDates = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const slot of bookedSlots) {
      const time = normalizeTime(slot.time);
      if (!map[slot.date]) map[slot.date] = new Set();
      map[slot.date].add(time);
    }

    const disabled: Date[] = [];
    const horizonDays = 365;
    const today = new Date();

    for (let i = 0; i < horizonDays; i++) {
      const target = new Date(today);
      target.setDate(today.getDate() + i);

      const dateKey = getDateKey(target);
      const baseTimes = getBaseTimesForDate(target);

      const bookedTimes = map[dateKey] ?? new Set();
      const remainingTimes = baseTimes.filter((time) => !bookedTimes.has(normalizeTime(time)));
      const viableTimes = remainingTimes.filter((time) => !isSlotTooSoon(target, time));

      if (viableTimes.length === 0) {
        disabled.push(new Date(Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())));
      }
    }

    return disabled;
  }, [bookedSlots, getBaseTimesForDate, isSlotTooSoon]);

  const hasAutoSelected = useRef(false);

  useEffect(() => {
    if (hasAutoSelected.current || value.startDate) return;

    const now = new Date();

    for (let i = 1; i <= 30; i++) {
      const testDate = new Date(now);
      testDate.setDate(now.getDate() + i);

      const testDateKey = getDateKey(testDate);

      const bookedTimes = bookedSlots
        .filter((slot) => getDateKey(slot.date) === testDateKey)
        .map((slot) => normalizeTime(slot.time));

      const candidateTime = getBaseTimesForDate(testDate).find(
        (t) => !bookedTimes.includes(t) && !isSlotTooSoon(testDate, t),
      );

      if (candidateTime) {
        onChange({
          selection: {
            startDate: testDate,
            endDate: testDate,
            key: 'selection',
          },
        });
        onTimeChange?.(candidateTime, { userInitiated: false });
        hasAutoSelected.current = true;
        break;
      }
    }
  }, [bookedSlots, getBaseTimesForDate, isSlotTooSoon, onChange, onTimeChange, value.startDate]);

  useEffect(() => {
    if (!value.startDate || userHasPickedTime.current) return;

    const dateKey = getDateKey(value.startDate);
    const bookedTimes = bookedSlots
      .filter((slot) => slot.date === dateKey)
      .map((slot) => normalizeTime(slot.time));

    const availableTimesForDate = getBaseTimesForDate(value.startDate ?? null).filter(
      (t) => !bookedTimes.includes(t) && !isSlotTooSoon(value.startDate ?? null, t),
    );

    if (!selectedTime || bookedTimes.includes(selectedTime) || isSlotTooSoon(value.startDate ?? null, selectedTime)) {
      if (availableTimesForDate.length > 0) {
        onTimeChange?.(availableTimesForDate[0], { userInitiated: false });
      } else {
        onTimeChange?.('', { userInitiated: false });
      }
    }
  }, [value.startDate, bookedSlots, selectedTime, onTimeChange, isSlotTooSoon, getBaseTimesForDate]);

  useEffect(() => {
    userHasPickedTime.current = false;
  }, [value.startDate]);

  useEffect(() => {
    if (!value.startDate) {
      setShowTimes(false);
    }
  }, [value.startDate]);

  useEffect(() => {
    if (forceOpenTimes) {
      setShowTimes(true);
      setShowReminder(true);
      onReminderDisplayed?.();
    }
  }, [forceOpenTimes, onReminderDisplayed]);

  const [visibleMonthDate, setVisibleMonthDate] = useState<Date>(
    value.startDate ?? new Date()
  );

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

  const normalizedRange = useMemo<Range>(
    () => ({
      ...value,
      startDate: value.startDate ?? new Date(),
      endDate: value.endDate ?? value.startDate ?? new Date(),
      key: 'selection',
    }),
    [value.endDate, value.startDate],
  );

  useEffect(() => {
    if (
      selectionMode === 'single' &&
      normalizedRange.startDate &&
      normalizedRange.endDate !== normalizedRange.startDate
    ) {
      onChange({
        selection: {
          ...normalizedRange,
          endDate: normalizedRange.startDate,
        },
      });
    }
  }, [selectionMode, normalizedRange, onChange]);

    const handleSingleSelect = useCallback((date: Date) => {
    onChange({
      selection: {
        startDate: date,
        endDate: date,
        key: 'selection',
      },
    });
  }, [onChange]);

  const handleRangeChange = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    const startDate = selection.startDate ?? normalizedRange.startDate ?? new Date();
    const endDate =
      selectionMode === 'multiple'
        ? selection.endDate ?? selection.startDate ?? startDate
        : startDate;

    onChange({
      selection: {
        ...selection,
        startDate,
        endDate,
        key: 'selection',
      },
    });
  };

  const handlePrevMonth = useCallback(() => {
    setVisibleMonthDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() - 1);

      const base = normalizedRange.startDate ?? new Date();
      const day = base.getDate();
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      const clampedDay = Math.min(day, lastDay);

      const newSelectedDate = new Date(
        next.getFullYear(),
        next.getMonth(),
        clampedDay,
      );

      handleSingleSelect(newSelectedDate);
      return next;
    });
  }, [normalizedRange.startDate, handleSingleSelect]);

  const handleNextMonth = useCallback(() => {
    setVisibleMonthDate((prev) => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);

      const base = normalizedRange.startDate ?? new Date();
      const day = base.getDate();
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      const clampedDay = Math.min(day, lastDay);

      const newSelectedDate = new Date(
        next.getFullYear(),
        next.getMonth(),
        clampedDay,
      );

      handleSingleSelect(newSelectedDate);
      return next;
    });
  }, [normalizedRange.startDate, handleSingleSelect]);

  return (
    <div className="flex flex-col gap-3">
      {/* <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectionMode('single')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm ${
            selectionMode === 'single'
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-700 border border-neutral-200'
          }`}
        >
          One Day
        </button>
        <button
          type="button"
          onClick={() => setSelectionMode('multiple')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition shadow-sm ${
            selectionMode === 'multiple'
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-700 border border-neutral-200'
          }`}
        >
          Multiple Days
        </button>
      </div> */}

      <AnimatePresence mode="wait">
        <motion.div
          key={selectionMode}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl bg-white p-3 shadow-xl"
        >
          <div className="flex flex-col gap-3">
            {/* Custom header: arrows + CalendarPicker in the middle */}
            <div className="mt-4 mb-2 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl shadow-md transition bg-white text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <BiSolidLeftArrow />
              </button>

              <div className="flex flex-row items-center gap-2">
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
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl shadow-md transition bg-white text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <BiSolidRightArrow />
              </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={visibleMonthDate.toISOString().slice(0, 7)}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                {selectionMode === 'multiple' ? (
                  <DateRange
                    ranges={[normalizedRange]}
                    onChange={handleRangeChange}
                    minDate={new Date()}
                    disabledDates={[...disabledDates, new Date()]}
                    showDateDisplay={false}
                    color="#262626"
                    moveRangeOnFirstSelection={false}
                    rangeColors={['#111111']}
                    shownDate={visibleMonthDate}
                    showMonthAndYearPickers={false}
                    showMonthArrow={false}
                  />
                ) : (
                  <DatePicker
                    date={normalizedRange.startDate}
                    onChange={handleSingleSelect}
                    minDate={new Date()}
                    disabledDates={[...disabledDates, new Date()]}
                    showDateDisplay={false}
                    color="#262626"
                    shownDate={visibleMonthDate}
                    showMonthAndYearPickers={false} // hide built-in month/year
                    showMonthArrow={false}          // hide built-in arrows, we use our own
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {value.startDate && (
        <div className="flex flex-col gap-2 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowTimes((open) => !open)}
            className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left text-lg font-medium text-neutral-800 shadow-sm"
          >
            <span>Choose a Time Slot</span>
            <motion.span
              aria-hidden
              animate={{ rotate: showTimes ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-xl"
            >
              ▾
            </motion.span>
          </button>

          {/* <AnimatePresence>
            {showReminder && reminderText && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm"
              >
                <span className="text-lg">⏰</span>
                <div>
                  <p className="font-semibold">Please double-check your time</p>
                  <p className="text-[13px] text-amber-800">{reminderText}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence> */}

          <AnimatePresence initial={false}>
            {showTimes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {availableTimesForSelectedDate.map((time) => {
                    const [hour, minute] = time.split(':').map(Number);
                    const isBooked = bookedTimesForDate.includes(time);
                    const isDisabled = isBooked || isSlotTooSoon(value.startDate ?? null, time);

                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
                    const formattedTime = `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

                    return (
                      <button
                        key={time}
                        onClick={() => {
                          userHasPickedTime.current = true;
                          setShowReminder(false);
                          onTimeChange?.(time, { userInitiated: true });
                        }}
                        disabled={isDisabled}
                        className={`
                          text-xs py-2 rounded-xl shadow-md bg-neutral-100 transition text-center
                          ${selectedTime === time ? 'ring-1 ring-black' : ''}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-aliceblue'}
                        `}
                      >
                        {formattedTime}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Calendar;