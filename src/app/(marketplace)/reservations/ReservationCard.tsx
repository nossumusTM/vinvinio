'use client';

import Image from 'next/image';
import { type MouseEvent, useMemo } from 'react';
import { format } from 'date-fns';

import Avatar from '../components/Avatar';
import Button from '../components/Button';
import useMessenger from '@/app/(marketplace)/hooks/useMessager';
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import { SafeReservation, SafeUser } from '@/app/(marketplace)/types';
import { TbCalendarTime, TbClock, TbUserSquareRounded } from 'react-icons/tb';

interface ReservationCardProps {
  reservation: SafeReservation;
  guestName: string;
  guestImage?: string;
  guestId?: string;
  currentUser?: SafeUser | null;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  currentUser,
  guestName,
  guestImage,
  guestId,
}) => {
  const messenger = useMessenger();
  const { formatConverted } = useCurrencyFormatter();

  const formattedDate = useMemo(
    () => format(new Date(reservation.startDate), 'PPP'),
    [reservation.startDate],
  );

  const formattedTime = useMemo(() => {
    if (!reservation.time) {
      return null;
    }

    const [hourString, minuteString] = reservation.time.split(':');
    const hour = Number(hourString);
    const minutes = Number(minuteString ?? '0');

    if (Number.isNaN(hour)) {
      return null;
    }

    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const meridiem = hour >= 12 ? 'PM' : 'AM';

    return `${hour12}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
  }, [reservation.time]);

  const handleMessageClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!guestId || currentUser?.id === guestId) {
      return;
    }

    messenger.openChat({
      id: guestId,
      name: guestName,
      image: guestImage,
    });
  };

  const canMessageGuest = Boolean(guestId) && currentUser?.id !== guestId;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-md transition duration-300 hover:shadow-lg">
      {Array.isArray(reservation.listing?.imageSrc) &&
        reservation.listing.imageSrc.length > 0 && (
          <Image
            src={reservation.listing.imageSrc[0]}
            alt="Listing"
            className="h-48 w-full object-cover"
            width={500}
            height={500}
          />
        )}

      <div className="flex flex-col gap-2 px-4 pt-2 pb-24 text-black">
        <div className="pb-4 text-lg font-semibold">
          {reservation.listing?.title}
        </div>

        <div className="mx-auto w-full max-w-md rounded-xl p-4 md:mx-0">
          <div className="flex flex-col gap-3">
            <div className="w-full rounded-2xl bg-white/90 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md">
                  <TbUserSquareRounded className="text-[18px] text-neutral-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">
                    Guests
                  </p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {reservation.guestCount}{' '}
                    <span className="font-normal text-neutral-700">
                      {reservation.guestCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl bg-white/90 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md">
                  <TbCalendarTime className="text-[18px] text-neutral-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">
                    Date
                  </p>
                  <p className="break-words text-[15px] font-semibold text-neutral-900">
                    {formattedDate}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl bg-white/90 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md">
                  <TbClock className="text-[18px] text-neutral-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">
                    Time
                  </p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {formattedTime ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl bg-white/90 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-md">
                  <span className="text-[12px] font-semibold text-neutral-700">€</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">
                    Total
                  </p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {formatConverted(reservation.totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 px-8 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => guestId && window.open(`/hosts/${guestId}`, '_blank')}
              className="shrink-0 rounded-full outline-none transition focus:ring-2 focus:ring-black/40"
              title="Open guest profile"
            >
              <Avatar src={guestImage} name={guestName} size={36} />
            </button>

            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-wide text-neutral-500">
                Booked by
              </p>
              <button
                type="button"
                onClick={() => guestId && window.open(`/hosts/${guestId}`, '_blank')}
                className="text-[15px] font-semibold leading-tight text-neutral-900 hover:underline"
              >
                {guestName}
              </button>
            </div>
          </div>

          {guestName === 'Guest' && (
            <p className="mt-2 text-xs text-neutral-600">
              Booked using guest mode
              {reservation.guestContact ? (
                <>
                  {', contact: '}
                  <span className="inline-block rounded bg-green-100 px-2 py-0.5 font-semibold text-green-700">
                    {reservation.guestContact}
                  </span>
                </>
              ) : (
                '.'
              )}
            </p>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mb-7 flex justify-center px-6">
            <Button
              label="Send a Message"
              onClick={handleMessageClick}
              disabled={!canMessageGuest}
              outline
              small
            />
          </div>
          <hr />
        </div>
      </div>
    </div>
  );
};

export default ReservationCard;
