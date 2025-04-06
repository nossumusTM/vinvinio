'use client';

import { Calendar as DatePicker } from 'react-date-range';
import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';

import { Range } from 'react-date-range'; // ✅ correct Range import

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface ReservationSlot {
  date: string;
  time: string;
}

interface CalendarProps {
  value: Range; // ✅ use Range type
  onChange: (value: { selection: Range }) => void; // ✅ updated
  selectedTime?: string;
  onTimeChange?: (time: string) => void;
  bookedSlots?: ReservationSlot[];
}

const availableTimes = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

const normalizeTime = (time: string) => {
  const [h, m = '00'] = time.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
};

const Calendar: React.FC<CalendarProps> = ({
  value,
  onChange,
  selectedTime,
  onTimeChange,
  bookedSlots = [],
}) => {
  const selectedDateKey = value.startDate
    ? format(value.startDate, 'yyyy-MM-dd')
    : '';

  const bookedTimesForDate = useMemo(() => {
    return bookedSlots
      .filter((slot) => slot.date === selectedDateKey)
      .map((slot) => normalizeTime(slot.time));
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
      .map(([date]) => new Date(date));
  }, [bookedSlots]);

  useEffect(() => {
    if (!selectedDateKey || selectedTime) return;

    const firstAvailable = availableTimes.find(
      (time) => !bookedTimesForDate.includes(time)
    );

    if (firstAvailable) {
      onTimeChange?.(firstAvailable);
    } else {
      onTimeChange?.('');
    }
  }, [selectedDateKey, bookedTimesForDate, selectedTime, onTimeChange]);

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
    <div className="flex flex-col gap-4">
      <DatePicker
        date={value.startDate}
        onChange={handleSelect}
        minDate={new Date()}
        disabledDates={disabledDates}
        showDateDisplay={false}
        color="#262626"
      />

      {/* {value.startDate && (
        <div className="flex flex-col gap-2 p-4">
          <label className="text-xl font-medium">Pick an Available Time</label>
          <select
            value={selectedTime}
            onChange={(e) => onTimeChange?.(e.target.value)}
            className="border border-neutral-300 rounded-md px-3 py-2 text-xl"
          >
            {availableTimes.map((time) => {
              const isBooked = bookedTimesForDate.includes(time);

              return (
                <option key={time} value={time} disabled={isBooked}>
                  {time} {isBooked ? '(Booked)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      )} */}
      {value.startDate && (
      <div className="flex flex-col gap-2 p-4">
        <label className="text-xl font-medium">Pick an Available Time</label>
        <select
          value={selectedTime}
          onChange={(e) => onTimeChange?.(e.target.value)}
          className="border border-neutral-300 rounded-xl px-3 py-2 text-m"
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
        </select>
      </div>
    )}
    </div>
  );
};

export default Calendar;
