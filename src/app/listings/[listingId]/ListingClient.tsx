'use client';

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Range } from "react-date-range";
import { useRouter } from "next/navigation";
import { differenceInDays, eachDayOfInterval } from 'date-fns';
import useMessenger from "@/app/hooks/useMessager";
import Button from "@/app/components/Button";
export const dynamic = 'force-dynamic';

import useLoginModal from "@/app/hooks/useLoginModal";
import { SafeListing, SafeReservation, SafeUser } from "@/app/types";

import Container from "@/app/components/Container";
import { categories } from "@/app/components/navbar/Categories";
import ListingHead from "@/app/components/listings/ListingHead";
import ListingInfo from "@/app/components/listings/ListingInfo";
import ListingReservation from "@/app/components/listings/ListingReservation";
import Avatar from "@/app/components/Avatar";

import ReviewsModal from "@/app/components/modals/ReviewModal";

const initialDateRange = {
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection'
};

interface ListingClientProps {
    reservations?: SafeReservation[];
    listing: SafeListing & {
        user: SafeUser;
    };
    currentUser?: SafeUser | null;
}

const ListingClient: React.FC<ListingClientProps> = ({
    listing,
    reservations = [],
    currentUser,
}) => {
    const loginModal = useLoginModal();
    const router = useRouter();

    const {
        hostDescription = '',
        experienceHour = undefined,
        meetingPoint = '',
        languages = [],
        locationType = [],
        locationDescription = ''
      } = listing;          

    const disabledDates = useMemo(() => {
        let dates: Date[] = [];

        reservations.forEach((reservation: any) => {
            const range = eachDayOfInterval({
                start: new Date(reservation.startDate),
                end: new Date(reservation.endDate)
            });

            dates = [...dates, ...range];
        });

        return dates;
    }, [reservations]);

    const bookedSlots = useMemo(() => {
        return reservations.map((reservation) => ({
            date: reservation.startDate.split('T')[0],
            time: reservation.time,
        }));
    }, [reservations]);

    const category = useMemo(() => {
        return categories.find((items) =>
            items.label === listing.category);
    }, [listing.category]);

    const [isLoading, setIsLoading] = useState(false);
    const [totalPrice, setTotalPrice] = useState(listing.price);
    const [dateRange, setDateRange] = useState<Range>(initialDateRange);
    const [selectedTime, setSelectedTime] = useState<string>();
    const [guestCount, setGuestCount] = useState(1);
    const [showAllReviews, setShowAllReviews] = useState(false);

    const [reviews, setReviews] = useState<{ 
        rating: number; 
        comment: string; 
        userName: string;
        userImage?: string;
        createdAt: string;
    }[]>([]);

    const messenger = useMessenger();

    const onCreateReservation = useCallback(() => {
        if (!currentUser) {
            return loginModal.onOpen();
        }
        setIsLoading(true);

        axios.post('/api/reservations', {
            totalPrice,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            listingId: listing?.id,
            selectedTime,
            guestCount,
        })
            .then(() => {
                toast.success('Listing reserved!');
                setDateRange(initialDateRange);
                router.push('/trips');
            })
            .catch(() => {
                toast.error('Something went wrong.');
            })
            .finally(() => {
                setIsLoading(false);
            })
    }, [
        totalPrice,
        dateRange,
        listing?.id,
        router,
        currentUser,
        loginModal,
        selectedTime
    ]);

    useEffect(() => {
        if (dateRange.startDate && listing.price) {
          setTotalPrice(listing.price * guestCount);
        }
    }, [dateRange, listing.price, guestCount]);   

    
    useEffect(() => {
        const fetchReviews = async () => {
          try {
            const res = await fetch('/api/reviews/get-by-listing', {
              method: 'POST',
              body: JSON.stringify({ listingId: listing.id }),
            });
            const data = await res.json();
            setReviews(data || []);
          } catch (err) {
            console.error('Failed to fetch reviews:', err);
          }
        };
      
        fetchReviews();
      }, [listing.id]);

      useEffect(() => {
        const fetchUserImages = async () => {
          const updatedReviews = await Promise.all(
            reviews.map(async (review) => {
              try {
                const res = await fetch("/api/users/get-user-image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: review.userName }),
                });                  
      
                const data = await res.json();
                return {
                  ...review,
                  userImage: data.image || '/images/placeholder.jpg',
                };
              } catch (err) {
                console.warn(`Failed to fetch image for ${review.userName}`, err);
                return {
                  ...review,
                  userImage: '/images/placeholder.jpg',
                };
              }
            })
          );
      
          setReviews(updatedReviews);
        };
      
        if (reviews.length > 0) fetchUserImages();
    }, [reviews]);

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return total / reviews.length;
    }, [reviews]);     

    return (
        <Container>
            <div className="max-w-screen-lg mx-auto">
                <div className="flex flex-col gap-6">
                    <ListingHead
                        title={listing.title}
                        imageSrc={Array.isArray(listing.imageSrc) ? listing.imageSrc : [listing.imageSrc]} // ✅ Fix here
                        locationValue={listing.locationValue}
                        id={listing.id}
                        currentUser={currentUser}
                    />

                    <Button
                    label="Contact Host"
                    onClick={() => {
                        const isHost = currentUser?.id === listing.user.id;

                        const recipient = isHost
                        ? {
                            id: reservations[0]?.user?.id ?? '',
                            name: reservations[0]?.user?.name ?? 'Guest',
                            image: reservations[0]?.user?.image ?? '',
                            }
                        : {
                            id: listing.user.id,
                            name: listing.user.name ?? 'Host',
                            image: listing.user.image ?? '',
                            };

                        if (recipient.id) {
                        messenger.openChat(recipient); // ✅ recipient is passed here
                        }
                    }}
                    />

                    
                    <div className="grid grid-cols-1 md:grid-cols-7 md:gap-10 mt-6 relative">
                        <ListingInfo
                            user={listing.user}
                            category={category}
                            description={listing.description}
                            hostName={listing.user.name ?? undefined}
                            guestCount={listing.guestCount}
                            experienceHour={experienceHour ?? undefined}
                            hostDescription={hostDescription ?? undefined}
                            locationValue={listing.locationValue}
                            meetingPoint={listing.meetingPoint ?? undefined}
                            imageSrc={typeof listing.imageSrc === 'string' ? [listing.imageSrc] : listing.imageSrc}
                            languages={languages}
                            locationType={listing.locationType ?? undefined}
                            locationDescription={listing.locationDescription ?? undefined}
                        />
                        <div className="order-first mb-10 md:order-last md:col-span-3">
                            <div className="md:sticky md:top-32">
                            <ListingReservation
                                listingId={listing.id}
                                price={listing.price}
                                totalPrice={totalPrice}
                                onChangeDate={(value) => setDateRange(value)}
                                dateRange={dateRange}
                                onSubmit={onCreateReservation}
                                disabled={isLoading}
                                disabledDates={disabledDates}
                                bookedSlots={bookedSlots}
                                selectedTime={selectedTime}
                                onTimeChange={setSelectedTime}
                                maxGuests={listing.guestCount}
                                guestCount={guestCount}
                                onGuestCountChange={setGuestCount} 
                            />
                            </div>
                        </div>
                    </div>
                    <div>

                    {reviews.length > 0 && (
                        <div className="mt-1 md:col-span-7 pt-10">
                            {/* Overall Rating */}
                            <div className="flex items-center gap-2 mb-4">
                                {/* SVG Star with partial fill */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <defs>
                                    <linearGradient id="starGradient">
                                        <stop offset={`${(averageRating / 5) * 100}%`} stopColor="black" />
                                        <stop offset={`${(averageRating / 5) * 100}%`} stopColor="lightgray" />
                                    </linearGradient>
                                    </defs>
                                    <path
                                    fill="url(#starGradient)"
                                    d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
                                        14.81 8.63 12 2 9.19 8.63 2 9.24 
                                        7.46 13.97 5.82 21 12 17.27z"
                                    />
                                </svg>

                                {/* Rating and count */}
                                <span className="text-xl text-neutral-700 font-normal">
                                    {averageRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="pt-2 pb-8">
                                <hr />
                            </div>
                            
                            {/* Individual Reviews */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reviews.slice(0, 6).map((review, i) => (
                                <div key={i} className="border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md">
                                {/* Rating Stars */}
                                <div className="flex gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`text-lg ${star <= review.rating ? 'text-black' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </span>
                                    ))}
                                </div>

                                {/* Comment */}
                                <p className="text-neutral-700 text-justify">{review.comment}</p>

                                {/* User info + date */}
                                <div className="flex items-center gap-3 mt-4">
                                    {review.userImage && (
                                    <Avatar src={review.userImage || '/images/placeholder.jpg'} name={review.userName} />
                                    )}
                                    <div>
                                    <p className="text-sm font-semibold text-neutral-800">{review.userName}</p>
                                    <p className="text-xs text-neutral-500">
                                        {new Date(review.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                                    </p>
                                    </div>
                                </div>
                                </div>
                            ))}
                            </div>

                            {/* Show all reviews button */}
                            {reviews.length > 2 && (
                            <div className="flex justify-center mt-6">
                                <button
                                onClick={() => setShowAllReviews(true)}
                                className="text-sm underline text-neutral-600 hover:text-black"
                                >
                                Show all reviews
                                </button>
                            </div>
                            )}

                            {/* Modal for all reviews */}
                            <ReviewsModal
                            isOpen={showAllReviews}
                            onClose={() => setShowAllReviews(false)}
                            reviews={reviews}
                            />
                        </div>
                        )}

                    </div>
                </div>
            </div>
        </Container>
    );
}

export default ListingClient;
