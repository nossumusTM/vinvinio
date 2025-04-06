'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { format } from 'date-fns';

import {
  SafeListing,
  SafeReservation,
  SafeUser
} from "@/app/types";

import HeartButton from "../HeartButton";
import Button from "../Button";

interface ListingCardProps {
  data: SafeListing;
  reservation?: SafeReservation;
  onAction?: (id: string) => void;
  disabled?: boolean;
  actionLabel?: string;
  actionId?: string;
  currentUser?: SafeUser | null;
};

const ListingCard: React.FC<ListingCardProps> = ({
  data,
  reservation,
  onAction,
  disabled,
  actionLabel,
  actionId = '',
  currentUser,
}) => {
  const router = useRouter();
  const [reviews, setReviews] = useState<{
    rating: number;
    comment: string;
    userName: string;
    userImage?: string;
    createdAt: string;
  }[]>([]);

  const [isHovered, setIsHovered] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const images: string[] = useMemo(
    () => (Array.isArray(data.imageSrc) ? data.imageSrc.filter(src => !/\.(mp4|webm|ogg)$/i.test(src)) : []),
    [data.imageSrc]
  );
  const firstHover = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const randomHeight = useMemo(() => Math.floor(Math.random() * 200) + 400, []);

  useEffect(() => {
    if (!isHovered || images.length <= 1) return;

    if (firstHover.current) {
      firstHover.current = false;
      setActiveImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }

    intervalRef.current = setInterval(() => {
      setActiveImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 1500);

    return () => {
      clearInterval(intervalRef.current!);
      setActiveImageIndex(0); // Reset to initial image
      firstHover.current = true;
    };
  }, [isHovered, images]);

  const hasFetched = useRef(false);

  const handleCancel = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (disabled) return;
      onAction?.(actionId);
    },
    [disabled, onAction, actionId]
  );

  const price = useMemo(() => {
    return reservation ? reservation.totalPrice : data.price;
  }, [reservation, data.price]);

  const reservationDate = useMemo(() => {
    if (!reservation) return null;
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    return `${format(start, 'PP')} - ${format(end, 'PP')}`;
  }, [reservation]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews/get-by-listing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId: data.id }),
        });
        const result = await res.json();
        setReviews(result || []);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };

    fetchReviews();
  }, [data.id]);

  return (
    <div
      onClick={() => router.push(`/listings/${data.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="col-span-1 cursor-pointer group pl-5 pr-5"
    >
      <div className="flex flex-col gap-2 w-full">
      <div
        className="w-full relative rounded-xl overflow-hidden transition-all duration-500"
        style={{ minHeight: 'auto', maxHeight: `${randomHeight}px`, height: `${randomHeight}px` }}
        >
          {images.map((img: string, i: number) => (
            <Image
              key={i}
              fill
              className={`object-cover h-full w-full absolute top-0 left-0 rounded-xl transition-opacity duration-700 ease-in-out ${i === activeImageIndex ? 'opacity-100' : 'opacity-0'}`}
              src={img}
              alt={`Listing ${i}`}
            />
          ))}

          <div className="absolute top-3 right-3">
            <HeartButton listingId={data.id} currentUser={currentUser} />
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
              <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
                      14.81 8.63 12 2 9.19 8.63 2 9.24 
                      7.46 13.97 5.82 21 12 17.27z" />
            </svg>
            <span className="font-medium">
              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="font-semibold text-lg">{data.title}</div>

        <div className="font-light text-neutral-500">
          {reservationDate || data.category}
        </div>

        <div className="flex flex-row items-center gap-1">
          <div className="font-semibold">€ {price}</div>
          {!reservation && <div className="font-light">/ person</div>}
        </div>

        {onAction && actionLabel && (
          <Button
            disabled={disabled}
            small
            label={actionLabel}
            onClick={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default ListingCard;
