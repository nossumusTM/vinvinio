'use client';

import { Calendar as DatePicker } from 'react-date-range';
import { useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';

import { Range } from 'react-date-range';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface ReservationSlot {
  date: string;
  time: string;
}

interface CalendarProps {
  value: Range; // ✅ use Range type
  onChange: (value: { selection: Range }) => void; // ✅ updated
  selectedTime?: string | null;
  onTimeChange?: (time: string | null) => void;
  bookedSlots?: ReservationSlot[];
}

const availableTimes = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

const normalizeTime = (time: string) => {
  const [h, m] = time.split(':').slice(0, 2);
  return `${h.padStart(2, '0')}:${m?.padStart(2, '0') ?? '00'}`;
};

const getDateKey = (date: Date | string) =>
  typeof date === 'string' ? date.slice(0, 10) : format(date, 'yyyy-MM-dd');

const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  selectedTime,
  onTimeChange,
  bookedSlots = [],
}) => {
  // const selectedDateKey = value.startDate
  // ? new Date(value.startDate).toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }) // 'sv-SE' keeps YYYY-MM-DD format
  // : '';
  const selectedDateKey = value.startDate
  ? format(value.startDate, 'yyyy-MM-dd')
  : '';

  const userHasPickedTime = useRef(false);

  const bookedTimesForDate = useMemo(() => {
    return bookedSlots
      .filter((slot) => slot.date === selectedDateKey)
      .map((slot) => slot.time);
  }, [bookedSlots, selectedDateKey]);

  const disabledDates = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const slot of bookedSlots) {
      const time = normalizeTime(slot.time);
      if (!map[slot.date]) map[slot.date] = new Set();
      map[slot.date].add(time);
    }

    return Object.entries(map)
      .filter(([_, times]) => times.size >= availableTimes.length)
      .map(([date]) => {
        const parts = date.split('-').map(Number);
        return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      });

  }, [bookedSlots]);

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
  
      if (bookedTimes.length < availableTimes.length) {
        const availableTime = availableTimes.find((t) => !bookedTimes.includes(t)) ?? null;
  
        onChange({
          selection: {
            startDate: testDate,
            endDate: testDate,
            key: 'selection',
          },
        });
  
        onTimeChange?.(availableTime);
        hasAutoSelected.current = true;
        break;
      }
    }
  }, [bookedSlots, value.startDate, onChange, onTimeChange]);

  useEffect(() => {
    if (!value.startDate || userHasPickedTime.current) return;
  
    // const dateKey = getDateKey(value.startDate);
    const dateKey = getDateKey(value.startDate);
    const matches = bookedSlots.filter((slot) => getDateKey(slot.date.trim()) === dateKey)
    // console.log("📅 Matched booked slots:", matches);
  
    const bookedTimes = bookedSlots
      .filter((slot) => slot.date === dateKey) // no getDateKey!
      .map((slot) => normalizeTime(slot.time));
  
    // console.log('📅 Date Key:', dateKey);
    // console.log('🔒 Booked Times:', bookedTimes);
  
    const availableTimesForDate = availableTimes.filter((t) => !bookedTimes.includes(t));
    // console.log('✅ Available Times:', availableTimesForDate);
  
    if (!selectedTime || bookedTimes.includes(selectedTime)) {
      if (availableTimesForDate.length > 0) {
        onTimeChange?.(availableTimesForDate[0]);
      } else {
        onTimeChange?.('');
      }
    }
  }, [value.startDate, bookedSlots, selectedTime, onTimeChange]);  

  useEffect(() => {
    userHasPickedTime.current = false;
  }, [value.startDate]);

  const handleSelect = (date: Date) => {
    onChange({
      selection: {
        startDate: date,
        endDate: date,
        key: 'selection',
      },
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <DatePicker
        date={value.startDate}
        onChange={handleSelect}
        minDate={new Date()}
        disabledDates={[...disabledDates, new Date()]}
        showDateDisplay={false}
        color="#262626"
      />

      {value.startDate && (
      <div className="flex flex-col gap-2 p-4">
        <label className="text-xl font-medium text-left">Choose a Time Slot</label>
        {/* <select
          value={selectedTime ?? ''}
          // onChange={(e) => onTimeChange?.(e.target.value)}
          onChange={(e) => {
            userHasPickedTime.current = true; // Mark as user-selected
            onTimeChange?.(e.target.value);
          }}
          className="shadow-md rounded-3xl px-3 py-2 text-m text-center"
        >
          {availableTimes.map((time) => {
            // const isBooked = bookedTimesForDate.includes(time);
            const isBooked = bookedTimesForDate.includes(time);

            // Disable if today and current time has passed this time
            const isToday = selectedDateKey === format(new Date(), 'yyyy-MM-dd');
            const now = new Date();
            const [hour, minute] = time.split(':').map(Number);
            const timeDate = new Date();
            timeDate.setHours(hour, minute, 0, 0);
            const isPast = isToday && now > timeDate;

            const isDisabled = isBooked || isPast;

            // Convert 24-hour time to 12-hour format with AM/PM
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
            const formattedTime = `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

            return (
              <option key={time} value={time} disabled={isDisabled}>
                {formattedTime} {isBooked ? 'Booked' : isPast ? 'Unavailable' : ''}
              </option>
            );
          })}
        </select> */}

        <div className="grid grid-cols-5 gap-2">
  {availableTimes.map((time) => {
    const isBooked = bookedTimesForDate.includes(time);
    const isToday = selectedDateKey === format(new Date(), 'yyyy-MM-dd');
    const now = new Date();
    const [hour, minute] = time.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hour, minute, 0, 0);
    const isPast = isToday && now > timeDate;
    const isDisabled = isBooked || isPast;

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    const formattedTime = `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

    return (
      <button
        key={time}
        onClick={() => {
          userHasPickedTime.current = true;
          onTimeChange?.(time);
        }}
        disabled={isDisabled}
        className={`
          text-xs py-2 rounded-xl shadow-md bg-neutral-100 transition text-center
          ${selectedTime === time ? 'ring-2 ring-aliceblue bg-aliceblue' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-aliceblue'}
        `}
      >
        {formattedTime}
      </button>
    );
  })}
</div>

      </div>
    )}

    </div>
  );
};

export default Calendar;
