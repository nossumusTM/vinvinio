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
import { FaPaperPlane } from "react-icons/fa";
import Button from "../components/Button";

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
  
      <div className="px-4 pt-2 pb-24 flex flex-col gap-2 text-black ">
        <div className="pb-4 text-lg font-semibold">{reservation.listing.title}</div>
  
        {/* Reservation Meta — stacked on all breakpoints (match TripsClient) */}
        <div className="pt-2 pb-2 w-full max-w-md p-4 rounded-xl md:mx-0 mx-auto">
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

        {/* Booked by — aligned with Guests / Date / Time */}
        <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-8 py-2.5">
          <div className="flex items-center gap-3">

            {/* Avatar */}
            <button
              type="button"
              onClick={() => {
                const profileSlug = reservation.user?.username || guestId;
                if (!profileSlug) return;
                window.open(`/social-card/${encodeURIComponent(profileSlug)}`, "_blank");
              }}
              className="shrink-0 rounded-full outline-none focus:ring-2 focus:ring-black/40 transition"
              title="Open guest profile"
            >
              <Avatar src={guestImage} name={guestName} size={36} />
            </button>

            {/* Booked by + Name (stacked) */}
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-wide text-neutral-500 leading-none">
                Booked by
              </p>
              <button
                onClick={() => {
                  const profileSlug = reservation.user?.username || guestId;
                  if (!profileSlug) return;
                  window.open(`/social-card/${encodeURIComponent(profileSlug)}`, "_blank");
                }}
                className="text-[15px] font-semibold text-neutral-900 hover:underline truncate leading-tight"
              >
                {guestName}
              </button>
            </div>

            {/* Message icon */}
            {/* {guestName !== 'Guest' && (
              <button
                onClick={() => {
                  if (currentUser?.id === guestId) return;
                  messenger.openChat({
                    id: guestId || '',
                    name: guestName,
                    image: guestImage || undefined,
                  });
                }}
                disabled={currentUser?.id === guestId}
                className="ml-auto h-10 w-10 aspect-square flex items-center justify-center rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black transition disabled:opacity-80"
                title="Message Guest"
              >
                <FaPaperPlane className="text-[20px]" />
              </button>
            )} */}
          </div>

          {/* Guest mode info */}
          {guestName === 'Guest' && (
            <p className="mt-2 text-xs text-neutral-600">
              Booked using guest mode
              {reservation.guestContact ? (
                <>
                  , contact:{" "}
                  <span className="inline-block bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded">
                    {reservation.guestContact}
                  </span>
                </>
              ) : '.'}
            </p>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mt-auto flex px-6 justify-center mb-7">
            <Button
              label="Send a Message"
              onClick={(e) => {
                if (currentUser?.id === guestId) return;
                messenger.openChat({
                  id: guestId || '',
                  name: guestName,
                  image: guestImage || undefined,
                });
              }}
              disabled={currentUser?.id === guestId}
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