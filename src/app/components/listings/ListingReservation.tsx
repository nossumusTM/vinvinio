'use client';

import { useRouter } from 'next/navigation';
import { Range } from 'react-date-range';
import Button from '../Button';
import Calendar from '../inputs/Calendar';
import Counter from '../inputs/Counter';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface ReservationSlot {
  date: string;
  time: string;
}

interface ListingReservationProps {
  listingId: string;
  price: number;
  dateRange: Range;
  totalPrice: number;
  onChangeDate: (value: Range) => void;
  onSubmit: () => void;
  disabled?: boolean;
  disabledDates: Date[];
  bookedSlots?: ReservationSlot[];
  selectedTime?: string;
  onTimeChange?: (time: string) => void;
  maxGuests: number;
  guestCount: number;
  onGuestCountChange: (value: number) => void;
}

const ListingReservation: React.FC<ListingReservationProps> = ({
  listingId,
  price,
  dateRange,
  totalPrice,
  onChangeDate,
  disabled,
  bookedSlots = [],
  selectedTime,
  onTimeChange,
  maxGuests,
  guestCount,
  onGuestCountChange,
}) => {
  const router = useRouter();

  const handleReserve = () => {
    if (!listingId || !selectedTime || !dateRange.startDate) {
      toast.error("Please select a date and time that is available.");
      return;
    }
  
    const selectedDateKey = new Date(dateRange.startDate).toLocaleDateString('sv-SE', {
      timeZone: 'Europe/Rome',
    });
  
    const normalizedTime = selectedTime.padStart(5, '0');
  
    const bookedTimes = bookedSlots
      .filter((slot) => slot.date === selectedDateKey)
      .map((slot) => slot.time.padStart(5, '0'));
  
    const isBooked = bookedTimes.includes(normalizedTime);
  
    const isToday = selectedDateKey === new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Europe/Rome',
    });
  
    const [hour, minute] = normalizedTime.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hour, minute, 0, 0);
  
    const isPast = isToday && new Date() > timeDate;
  
    if (isBooked || isPast) {
      toast.error('This time slot is not available. Please choose another.');
      return;
    }
  
    const searchParams = new URLSearchParams({
      listingId,
      guests: guestCount.toString(),
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate?.toISOString() || dateRange.startDate.toISOString(),
      time: selectedTime,
    });
  
    router.push(`/checkout?${searchParams.toString()}`);
  };  

  return (
    <div>
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border-[1px] border-neutral-200 overflow-hidden">
      <div className="flex flex-row items-center justify-between p-4">
        <div className="flex flex-row items-baseline gap-2">
          <div className="text-3xl font-semibold">€ {price}</div>
          <div className="font-light text-neutral-600">/ person</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium mb-2 text-center">Guests</div>
          <Counter
            title=""
            subtitle=""
            value={guestCount}
            onChange={(value) => {
              const safeValue = typeof value === 'number' ? value : 1;
              onGuestCountChange(Math.min(safeValue, maxGuests));
            }}
          />
        </div>
      </div>

      <hr />

      <Calendar
        value={dateRange}
        bookedSlots={bookedSlots}
        selectedTime={selectedTime}
        onTimeChange={(time) => onTimeChange?.(time ?? '')}
        onChange={(value) => onChangeDate(value.selection)}
      />

      <hr />

      <div className="p-4">
        <Button
          disabled={disabled || !selectedTime}
          label="Reserve"
          onClick={handleReserve}
        />
      </div>

      <hr />

      <div className="p-4 flex flex-row items-center justify-center font-semibold text-lg">
        <div className="flex flex-row items-baseline gap-2">
          <div>Checkout:</div>
          <div>€ {totalPrice}</div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ListingReservation;
