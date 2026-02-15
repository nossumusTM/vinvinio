'use client';

import { useRouter } from 'next/navigation';
import { Range } from 'react-date-range';
import Button from '../Button';
import Calendar from '../inputs/Calendar';
import Counter from '../inputs/Counter';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import { AnimatePresence, motion } from 'framer-motion';
import { ListingAvailabilityRules } from '@/app/(marketplace)/utils/timeSlots';

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
  averageRating: number;
  reviewCount: number;
  categoryLabel?: string;
  pricingType?: string | null;
  groupPrice?: number | null;
  groupSize?: number | null;
  customPricing?: { minGuests: number; maxGuests: number; price: number }[] | null;
  /** Minimum hours before start that the experience can be booked */
  hoursInAdvance?: number | null;
  availabilityRules?: ListingAvailabilityRules | null;
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
  averageRating,
  reviewCount,
  categoryLabel,
  pricingType,
  groupPrice,
  groupSize,
  customPricing,
  hoursInAdvance,
  availabilityRules
}) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [showCustomPricing, setShowCustomPricing] = useState(false);
  const [hasConfirmedSlot, setHasConfirmedSlot] = useState(false);
  const [forceOpenTimes, setForceOpenTimes] = useState(false);
  const { formatConverted } = useCurrencyFormatter();

  const isGroupPricing = pricingType === 'group' && !!groupPrice;
  const isCustomPricing = pricingType === 'custom' && Array.isArray(customPricing) && customPricing.length > 0;

  useEffect(() => {
    setHasConfirmedSlot(false);
  }, [dateRange.startDate]);

  const perPersonPrice = useMemo(() => {
    if (isGroupPricing) {
      return groupPrice ?? price;
    }

    if (isCustomPricing && customPricing) {
      const sorted = [...customPricing].sort((a, b) => a.minGuests - b.minGuests);
      const matchedTier = sorted.find(
        (tier) => guestCount >= tier.minGuests && guestCount <= tier.maxGuests,
      );

      if (matchedTier) return matchedTier.price;

      if (guestCount > sorted[sorted.length - 1].maxGuests) {
        return sorted[sorted.length - 1].price;
      }

      return sorted[0].price;
    }

    return price;
  }, [customPricing, guestCount, groupPrice, isCustomPricing, isGroupPricing, price]);

  const handleReserve = () => {
    if (!listingId) {
      toast.error('This service is currently unavailable.');
      return;
    }

    if (!dateRange.startDate) {
      toast.error('Please select a date for your service.');
      return;
    }

    if (!dateRange.endDate) {
      toast.error('Please select your full date range.');
      return;
    }

    if (!selectedTime) {
      setForceOpenTimes(true);
      toast.error('Choose a time slot before booking.');
      return;
    }

    if (!hasConfirmedSlot) {
      setForceOpenTimes(true);
      toast('Please double-check your booking time before continuing.');
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

    // ⏱ enforce hoursInAdvance if provided
    if (typeof hoursInAdvance === 'number' && hoursInAdvance > 0) {
      const now = new Date();
      const reservationStart = new Date(dateRange.startDate);
      reservationStart.setHours(hour, minute, 0, 0);

      const diffMs = reservationStart.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < hoursInAdvance) {
        toast.error(
          `This service must be booked at least ${hoursInAdvance} hour${
            hoursInAdvance === 1 ? '' : 's'
          } in advance.`,
        );
        return;
      }
    }

    setIsLoading(true);

    const searchParams = new URLSearchParams({
      listingId,
      guests: guestCount.toString(),
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate?.toISOString() || dateRange.startDate.toISOString(),
      time: selectedTime,
      averageRating: averageRating.toFixed(1),
      reviewCount: reviewCount.toString(),
      categoryLabel: categoryLabel || '',
    });

    router.push(`/checkout?${searchParams.toString()}`);
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-md hover:shadow-lg overflow-hidden">
        <div className="space-y-3 p-4">
          {/* {(isCustomPricing || isGroupPricing) && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {isCustomPricing && (
                  <button
                    type="button"
                    aria-expanded={showCustomPricing}
                    onClick={() => setShowCustomPricing((open) => !open)}
                    className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 px-3 py-1.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-90"
                    >
                      <path
                        d="M4 10.5L10.5 4L17 10.5M7 13.5L10.5 10L14 13.5M10.5 20V10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Custom Pricing
                    <motion.span
                      animate={{ rotate: showCustomPricing ? 180 : 0 }}
                      className="inline-block"
                      transition={{ duration: 0.2 }}
                    >
                      ▾
                    </motion.span>
                  </button>
                )}

              </div>
              {isGroupPricing && (
                <span className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-800 shadow-sm">
                  Up to {groupSize ?? 11} guests
                </span>
              )}
            </div>
          )} */}

          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-baseline gap-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={perPersonPrice}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="text-3xl font-semibold inline-block"
                >
                  {formatConverted(perPersonPrice)}
                </motion.span>
              </AnimatePresence>
              <div className="font-light text-neutral-600">{isGroupPricing ? '/ group' : '/ person'}</div>
            </div>
            {!isGroupPricing && (
              <div className="flex flex-col gap-1">
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
            )}
          </div>

          <AnimatePresence initial={false}>
            {showCustomPricing && isCustomPricing && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 shadow-inner"
              >
                <div className="text-xs uppercase tracking-wide text-neutral-500">Pricing by guests</div>
                <div className="mt-2 space-y-2 text-sm text-neutral-800">
                  {customPricing?.map((tier) => (
                    <div
                      key={`${tier.minGuests}-${tier.maxGuests}`}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm"
                    >
                      <span>
                        {tier.minGuests} - {tier.maxGuests} guests
                      </span>
                      <span className="font-semibold">{formatConverted(tier.price)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <hr />

        <Calendar
          value={dateRange}
          bookedSlots={bookedSlots}
          selectedTime={selectedTime}
          onTimeChange={(time, meta) => {
            if (meta?.userInitiated) {
              setHasConfirmedSlot(true);
              setForceOpenTimes(false);
            } else {
              setHasConfirmedSlot(false);
            }
            onTimeChange?.(time ?? '');
          }}
          onChange={(value) => onChangeDate(value.selection)}
          forceOpenTimes={forceOpenTimes}
          reminderText="Please confirm the time of your booking before continuing."
          onReminderDisplayed={() => setForceOpenTimes(false)}
          availabilityRules={availabilityRules}
          hoursInAdvance={hoursInAdvance ?? undefined}
        />

        <hr />

        <div className="p-4">
          <div
            className={`w-full ${
              dateRange.startDate && dateRange.endDate && selectedTime ? 'animated-border' : ''
            } ${isLoading ? 'animate-pulse' : ''}`}
          >
            <Button
              label={isLoading ? 'Booking...' : 'Book Now'}
              onClick={handleReserve}
              disabled={disabled || isLoading}
            />
          </div>
        </div>

        <hr />

        <div className="p-4 flex flex-row items-center justify-center font-semibold text-lg">
          <div className="flex flex-row items-baseline gap-2">
            <div>Checkout:</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={totalPrice}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {formatConverted(totalPrice)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingReservation;
