// 'use client';

// import { Calendar as DatePicker } from 'react-date-range';
// import { useEffect, useMemo, useRef } from 'react';
// import { format } from 'date-fns';
// import toast from 'react-hot-toast';
// import { toZonedTime } from 'date-fns-tz';

// import { Range } from 'react-date-range';

// import 'react-date-range/dist/styles.css';
// import 'react-date-range/dist/theme/default.css';
// import { isSameDay } from 'date-fns';

// interface ReservationSlot {
//   date: string;
//   time: string;
// }

// interface CalendarProps {
//   value: Range; // ✅ use Range type
//   onChange: (value: { selection: Range }) => void; // ✅ updated
//   selectedTime?: string | null;
//   onTimeChange?: (time: string | null) => void;
//   bookedSlots?: ReservationSlot[];
// }

// export const availableTimes = [
//   '08:00', '09:00', '10:00', '11:00', '12:00',
//   '13:00', '14:00', '15:00', '16:00', '17:00',
// ];

// const getLocalDateKey = (isoDateString: string) => {
//   const date = new Date(isoDateString);
//   return format(
//     new Date(date.getFullYear(), date.getMonth(), date.getDate()),
//     'yyyy-MM-dd'
//   );
// };

// const normalizeTime = (time: string) => {
//   const [h, m = '00'] = time.split(':');
//   return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
// };

// const getBookedAndUnavailableTimes = (dateKey: string, bookedSlots: ReservationSlot[]) => {
//   return bookedSlots
//     .filter((slot) => {
//       // 🔥 this forces local timezone comparison
//       const slotDate = new Date(`${slot.date}T00:00:00`);
//       const slotDateKey = format(slotDate, 'yyyy-MM-dd');
//       return slotDateKey === dateKey;
//     })
//     .map((slot) => normalizeTime(slot.time));
// };

// const Calendar: React.FC<CalendarProps> = ({
//   value,
//   onChange,
//   selectedTime,
//   onTimeChange,
//   bookedSlots = [],
// }) => {
//   const selectedDateKey = value.startDate
//   ? format(value.startDate, 'yyyy-MM-dd')
//   : '';

//   const bookedTimesForDate = useMemo(() => {
//     return bookedSlots
//       .filter((slot) => getLocalDateKey(slot.date) === selectedDateKey)
//       .map((slot) => normalizeTime(slot.time));
//   }, [bookedSlots, selectedDateKey]);  
  
//   const availableTimesForDate = useMemo(() => {
//     return availableTimes.filter((time) => !bookedTimesForDate.includes(time));
//   }, [bookedTimesForDate]);

//   const disabledDates = useMemo(() => {
//     const disabled: Date[] = [];
  
//     for (let i = 0; i <= 30; i++) {
//       const testDate = new Date();
//       testDate.setDate(testDate.getDate() + i);
//       testDate.setHours(0, 0, 0, 0);
  
//       const dateKey = format(testDate, 'yyyy-MM-dd');
  
//       const bookedTimes = bookedSlots
//         .filter((slot) => getLocalDateKey(slot.date) === dateKey)
//         .map((slot) => normalizeTime(slot.time));
  
  
//       const availableTimesForDay = availableTimes.filter((time) => {
//         const [hour, minute] = time.split(':').map(Number);
//         const timeObj = new Date(testDate);
//         timeObj.setHours(hour, minute, 0, 0);
  
//         const now = new Date();
//         const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
//         const isPast = dateKey === format(now, 'yyyy-MM-dd') && timeObj < threeHoursLater;
  
//         return !bookedTimes.includes(time) && !isPast;
//       });
  
//       if (availableTimesForDay.length === 0) {
//         disabled.push(new Date(testDate));
//       }
//     }
  
//     return disabled;
//   }, [bookedSlots]);  

//   const hasAutoSelected = useRef(false);

//   useEffect(() => {
//     if (hasAutoSelected.current || value.startDate) return;
  
//     const now = new Date();
  
//     for (let i = 1; i <= 30; i++) {
//       const testDate = new Date(now);
//       testDate.setDate(now.getDate() + i);
    
//       const currentKey = testDate.toLocaleDateString('sv-SE', {
//         timeZone: 'Europe/Rome',
//       });
    
//       const bookedTimes = getBookedAndUnavailableTimes(currentKey, bookedSlots);    
  
//       if (bookedTimes.length < availableTimes.length) {
//         const availableTime = availableTimes.find((t) => !bookedTimes.includes(t)) ?? null;
  
//         // ⛳️ Set both date and time inline before render
//         onChange({
//           selection: {
//             startDate: testDate,
//             endDate: testDate,
//             key: 'selection',
//           },
//         });
  
//         onTimeChange?.(availableTime);
//         hasAutoSelected.current = true;
//         break;
//       }
//     }
//   }, [bookedSlots, value.startDate, onChange, onTimeChange]);  

//   useEffect(() => {
//     if (!value.startDate) return;
  
//     const formatted = format(value.startDate, 'yyyy-MM-dd');
//     const booked = getBookedAndUnavailableTimes(formatted, bookedSlots);
  
//     const firstAvailable = availableTimes.find((t) => !booked.includes(t));
  
//     onTimeChange?.(firstAvailable ?? null);
//   }, [value.startDate, bookedSlots]); 
  
//   useEffect(() => {
//     if (!value.startDate) return;
  
//     const formatted = format(value.startDate, 'yyyy-MM-dd');
//     const timesBooked = bookedSlots
//       .filter((slot) => slot.date === formatted)
//       .map((slot) => normalizeTime(slot.time));
  
//     const available = availableTimes.find((t) => !timesBooked.includes(t));
  
//     if (available) {
//       onTimeChange?.(available);
//     } else {
//       onTimeChange?.('');
//     }
//   }, [value.startDate, bookedSlots]);  

//   const handleSelect = (date: Date) => {
//     const selectedDateKey = format(date, 'yyyy-MM-dd');
//     const isDisabled = disabledDates.some((d) => isSameDay(d, date));
  
//     if (isDisabled) {
//       toast.error("Bu tarix tam doludur.");
//       onChange({
//         selection: {
//           startDate: undefined,
//           endDate: undefined,
//           key: 'selection',
//         },
//       });
//       onTimeChange?.(null);
//       return;
//     }
  
//     const bookedTimes = getBookedAndUnavailableTimes(selectedDateKey, bookedSlots);
//     const firstAvailable = availableTimes.find((t) => !bookedTimes.includes(t));
  
//     // ✅ BUNU QOYUN: Əgər heç bir vaxt boş deyilsə, null yazırıq
//     onTimeChange?.(firstAvailable ?? null);
  
//     onChange({
//       selection: {
//         startDate: date,
//         endDate: date,
//         key: 'selection',
//       },
//     });
//   };   

//   return (
//     <div className="flex flex-col">
//       <DatePicker
//         date={value.startDate}
//         onChange={handleSelect}
//         minDate={new Date()}
//         disabledDates={disabledDates}
//         showDateDisplay={false}
//         color="#000"
//       />

//       {/* {value.startDate && (
//         <div className="flex flex-col gap-2 p-4">
//           <label className="text-xl font-medium">Pick an Available Time</label>
//           <select
//             value={selectedTime}
//             onChange={(e) => onTimeChange?.(e.target.value)}
//             className="border border-neutral-300 rounded-md px-3 py-2 text-xl"
//           >
//             {availableTimes.map((time) => {
//               const isBooked = bookedTimesForDate.includes(time);

//               return (
//                 <option key={time} value={time} disabled={isBooked}>
//                   {time} {isBooked ? '(Booked)' : ''}
//                 </option>
//               );
//             })}
//           </select>
//         </div>
//       )} */}
//       {value.startDate && (
//         <div className="flex flex-col gap-2 p-4">
//           <label className="text-xl font-medium text-center">Pick a Convenient Time</label>

//           {/* {availableTimes.every((t) => bookedTimesForDate.includes(t)) ? (
//   <p className="text-center text-sm text-neutral-500">
//     Bu tarix üçün boş vaxt yoxdur.
//   </p>
//           ) : (
//             <select
//               value={selectedTime ?? ''}
//               onChange={(e) => onTimeChange?.(e.target.value)}
//               className="border border-neutral-300 rounded-xl px-3 py-2 text-m text-center"
//             >
//               {availableTimes.map((time) => {
//                 const isBooked = bookedTimesForDate.includes(time);
//                 const isToday = selectedDateKey === format(new Date(), 'yyyy-MM-dd');
//                 const now = new Date();
//                 const [hour, minute] = time.split(':').map(Number);
//                 const timeDate = new Date();
//                 timeDate.setHours(hour, minute, 0, 0);
//                 const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
//                 const isPast = isToday && threeHoursLater > timeDate;
//                 const isDisabled = isBooked || isPast;

//                 const ampm = hour >= 12 ? 'PM' : 'AM';
//                 const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
//                 const formattedTime = `${formattedHour}:${String(minute).padStart(2, '0')} ${ampm}`;

//                 return (
//                   <option key={time} value={time} disabled={isDisabled}>
//                     {formattedTime} {isBooked ? 'Booked' : isPast ? 'Unavailable' : ''}
//                   </option>
//                 );
//               })}
//             </select>
//           )} */}

// {availableTimes.every((t) => bookedTimesForDate.includes(t)) ? (
//   <p className="text-center text-sm text-neutral-500">
//     All time slots for this day are booked.
//   </p>
// ) : (
//   <select
//     value={selectedTime ?? ''}
//     onChange={(e) => onTimeChange?.(e.target.value)}
//     className="border border-neutral-300 rounded-xl px-3 py-2 text-m text-center"
//   >
//     {availableTimes.map((time) => {
//   const normalized = normalizeTime(time);

//   // ✅ Correctly check if time is booked for selectedDateKey
//   const isBooked = bookedSlots.some(slot => {
//     const slotDate = getLocalDateKey(slot.date);
//     return slotDate === selectedDateKey && normalizeTime(slot.time) === normalized;
//   });  

//   const isToday = selectedDateKey === format(new Date(), 'yyyy-MM-dd');
//   const now = new Date();
//   const [hour, minute] = normalized.split(':').map(Number);
//   const timeDate = new Date();
//   timeDate.setHours(hour, minute, 0, 0);
//   const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
//   const isPast = isToday && timeDate < threeHoursLater;

//   const isDisabled = isBooked || isPast;

//   const ampm = hour >= 12 ? 'PM' : 'AM';
//   const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
//   const formattedTime = `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

//   return (
//     <option key={time} value={time} disabled={isDisabled}>
//       {formattedTime} {isBooked ? '(Booked)' : isPast ? '(Unavailable)' : ''}
//     </option>
//   );
// })}
//   </select>
// )}


//         </div>
//       )}

//     </div>
//   );
// };

// export default Calendar;

'use client';

import {
    DateRange,
    Range,
    RangeKeyDict
} from 'react-date-range';

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface DatePickerProps {
    value: Range,
    onChange: (value: RangeKeyDict) => void;
    disabledDates?: Date[];
}

const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    disabledDates
}) => {
    return (
        <DateRange
            rangeColors={['#262626']}
            ranges={[value]}
            date={new Date()}
            onChange={onChange}
            direction="vertical"
            showDateDisplay={false}
            minDate={new Date()}
            disabledDates={disabledDates}
        />
    );
}

export default DatePicker;