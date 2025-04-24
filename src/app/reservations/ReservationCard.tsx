'use client';

import Image from "next/image";
import { useMemo } from "react";
import { format } from 'date-fns';
import Avatar from "../components/Avatar";
import { SafeReservation, SafeUser } from "@/app/types";
import useMessenger from "@/app/hooks/useMessager";

interface ReservationCardProps {
    reservation: SafeReservation;
    guestName: string;
    guestImage?: string;
    guestId?: string;
    currentUser?: SafeUser | null;
  }  

const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, currentUser, guestName, guestImage, guestId }) => {
  const messenger = useMessenger();

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
    <div className="relative bg-white border border-neutral-200 rounded-3xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden">
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
        <div className="text-lg font-semibold">{reservation.listing.title}</div>
  
        <div className="text-sm text-neutral-600">
          {reservationDate}
        </div>
  
        <div className="text-sm text-neutral-700 font-medium">
          {reservation.guestCount === 1 ? 'Traveller' : 'Travellers'}: {reservation.guestCount}
        </div>
  
        <div className="text-lg font-bold">€ {reservation.totalPrice.toFixed(2)}</div>
  
        <div className="flex flex-col items-center mt-4">
            <p className="text-md font-medium text-neutral-700 mb-2">Booked by</p>
            <Avatar src={guestImage} name={guestName} />
            <span className="text-xl font-bold mt-2">{guestName}</span>

            {guestName === 'Guest' ? (
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
                ) : (
                <button
                    onClick={() => {
                    if (currentUser?.id === guestId) return;
                    messenger.openChat({ id: guestId || '', name: guestName, image: guestImage });
                    }}
                    className="text-sm text-neutral-700 hover:underline hover:text-black transition mt-2"
                >
                    Message {guestName}
                </button>
                )}
            </div>
      </div>
    </div>
  );
  
};

export default ReservationCard;