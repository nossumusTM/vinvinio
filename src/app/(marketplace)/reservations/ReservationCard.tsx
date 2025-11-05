'use client';

import Image from "next/image";
import { useMemo } from "react";
import { format } from 'date-fns';
import Avatar from "../components/Avatar";
import { SafeReservation, SafeUser } from "@/app/(marketplace)/types";
import { BiPaperPlane } from "react-icons/bi";
import useMessenger from "@/app/(marketplace)/hooks/useMessager";
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
// add to imports at top of ReservationCard.tsx
import { TbCalendarTime, TbClock, TbUserSquareRounded } from "react-icons/tb";

interface ReservationCardProps {
    reservation: SafeReservation;
    guestName: string;
    guestImage?: string;
    guestId?: string;
    currentUser?: SafeUser | null;
  }  

const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, currentUser, guestName, guestImage, guestId }) => {
  const messenger = useMessenger();
  const { formatConverted } = useCurrencyFormatter();

  const reservationDate = useMemo(() => {
    const start = new Date(reservation.startDate);
    const time24 = reservation.time;
    if (!time24) return format(start, 'PP');
    const [hourStr, minuteStr] = time24.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr.padStart(2, '0');
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${format(start, 'PP')} at ${hour12}:${minute} ${period}`;
  }, [reservation]);

  return (
    <div className="relative bg-white rounded-3xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden">
      {Array.isArray(reservation.listing?.imageSrc) && reservation.listing.imageSrc.length > 0 && (
        <Image
          src={reservation.listing.imageSrc[0]}
          alt="Listing"
          className="w-full h-48 object-cover"
          width={500}
          height={500}
        />
      )}
  
      <div className="p-4 flex flex-col gap-2">
        <div className="pb-4 text-lg font-semibold">{reservation.listing.title}</div>
  
        {/* Reservation Meta — stacked on all breakpoints (match TripsClient) */}
        <div className="pt-2 pb-4 w-full max-w-md p-4 rounded-xl md:mx-0 mx-auto">
          <div className="flex flex-col  gap-3">

            {/* Guests */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                  <TbUserSquareRounded className="text-neutral-700 text-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">Guests</p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {reservation.guestCount}{' '}
                    <span className="font-normal text-neutral-700">
                      {reservation.guestCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                  <TbCalendarTime className="text-neutral-700 text-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">Date</p>
                  <p className="text-[15px] font-semibold text-neutral-900 break-words">
                    {format(new Date(reservation.startDate), 'PPP')}
                  </p>
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                  <TbClock className="text-neutral-700 text-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">Time</p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {(() => {
                      const [h, m] = reservation.time.split(':').map(Number);
                      const hour12 = (h % 12) || 12;
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      return `${hour12}:${String(m ?? 0).padStart(2, '0')} ${ampm}`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                  {/* keep style consistent, no icon used in TripsClient for price; leaving box for visual rhythm */}
                  <span className="text-neutral-700 text-[12px] font-semibold">€</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">Total</p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {formatConverted(reservation.totalPrice)}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="flex flex-col items-center mt-4 mb-4">
          <p className="text-xs font-medium text-neutral-700 mb-2">Booked by</p>

          {/* Avatar clickable → open guest profile */}
          <button
            type="button"
            onClick={() => guestId && window.open(`/hosts/${guestId}`, "_blank")}
            className="rounded-full outline-none focus:ring-2 focus:ring-black/40 transition"
          >
            <Avatar src={guestImage} name={guestName} />
          </button>

          {/* Name clickable → open guest profile */}
          <span
            onClick={() => guestId && window.open(`/hosts/${guestId}`, "_blank")}
            className="text-md font-semibold text-neutral-900 hover:underline cursor-pointer mt-2"
          >
            {guestName}
          </span>

          {/* Direct Message button */}
          {guestName !== 'Guest' && (
            <button
              onClick={() => {
                if (currentUser?.id === guestId) return;
                messenger.openChat({ id: guestId || '', name: guestName, image: guestImage });
              }}
              className="text-xs text-neutral-700 hover:bg-neutral-200 bg-neutral-100 p-3 font-semibold rounded-lg transition mt-2"
            >
              <div className="flex flex-row gap-1 items-center">
                {/* <BiPaperPlane size={12} /> */}
                <p> Direct Message</p>
              </div>
            </button>
          )}

          {/* Guest mode info stays the same */}
          {guestName === 'Guest' && (
            <div className="text-sm text-neutral-600 text-center mt-2 px-10 flex flex-col justify-center items-center">
              Booked using guest mode
              {reservation.guestContact ? (
                <>
                  , contact: {' '}
                  <span className="inline-block bg-green-100 text-green-700 font-semibold px-3 py-1 mt-2 rounded-md shadow-sm">
                    {reservation.guestContact}
                  </span>
                </>
              ) : (
                '.'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
};

export default ReservationCard;