'use client';

import axios from "axios";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import qs from 'query-string';
import { useSearchParams, usePathname } from 'next/navigation';
import { formatISO } from 'date-fns';

import { toast } from "react-hot-toast";
import { Range } from "react-date-range";
import { useRouter } from "next/navigation";
import { differenceInDays, eachDayOfInterval } from 'date-fns';
import useMessenger from "@/app/hooks/useMessager";
import Button from "@/app/components/Button";
export const dynamic = 'force-dynamic';
import Heading from "@/app/components/Heading";

import { format } from 'date-fns';

import useLoginModal from "@/app/hooks/useLoginModal";
import { SafeListing, SafeReservation, SafeUser } from "@/app/types";
import getCurrentUser from "@/app/actions/getCurrentUser";

import Container from "@/app/components/Container";
import { categories } from "@/app/components/navbar/Categories";
import ListingHead from "@/app/components/listings/ListingHead";
import ListingInfo from "@/app/components/listings/ListingInfo";
import ListingReservation from "@/app/components/listings/ListingReservation";
import { motion, AnimatePresence } from 'framer-motion'
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
    const params = useSearchParams();
    const pathname = usePathname();

    const [dateDirty, setDateDirty] = useState(false);
    const [guestsDirty, setGuestsDirty] = useState(false);

    const didInitFromParams = useRef(false);

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

    // const bookedSlots = useMemo(() => {
    //     return reservations.map((reservation) => ({
    //         date: reservation.startDate.split('T')[0],
    //         time: reservation.time,
    //     }));
    // }, [reservations]);

    // console.log("🕓 Raw reservation times:", reservations.map(r => r.time));

    const normalizeTime = (time: string) => {
        const [h, m] = time.split(':').slice(0, 2);
        return `${h.padStart(2, '0')}:${m?.padStart(2, '0') ?? '00'}`;
      };
      
      const bookedSlots = useMemo(() => {
        return reservations.map((reservation) => ({
          date: reservation.startDate.split('T')[0],
          time: normalizeTime(reservation.time),
        }));
      }, [reservations]);          

    // const category = useMemo(() => {
    //     const cat = listing.category;
    //     const categoryArray = Array.isArray(cat) ? cat : typeof cat === 'string' ? [cat] : [];
      
    //     return categories.find((item) => categoryArray.includes(item.label));
    //   }, [listing.category]);   
    
    const category = useMemo(() => {
        const cat = listing.category;
        const categoryArray = Array.isArray(cat)
            ? cat
            : typeof cat === 'string'
            ? [cat]
            : [];

        const found = categories.find((item) =>
            categoryArray.includes(item.label)
        );

        return {
            label: found?.label ?? categoryArray[0] ?? 'General',
            description: found?.description ?? 'No category description provided.',
            imageSrc: listing.user?.image ?? null // ✅ Use listing.user
        };
        }, [listing.category, listing.user]);


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

        // axios.post('/api/reservations', {
        //     totalPrice,
        //     startDate: dateRange.startDate,
        //     endDate: dateRange.endDate,
        //     listingId: listing?.id,
        //     selectedTime,
        //     guestCount,
        // })

        // ✅ sync query so guest count & dates are carried forward (no scroll jump)
        const currentQuery = params ? qs.parse(params.toString()) : {};
        const updatedQuery: any = {
        ...currentQuery,
        listingId: listing?.id,
        startDate: dateRange.startDate ? formatISO(dateRange.startDate as Date) : undefined,
        endDate:   dateRange.endDate   ? formatISO(dateRange.endDate   as Date) : undefined,
        time: selectedTime,
        guestCount,                 // primary key
        guests: String(guestCount), // legacy fallback
        };

        router.replace(
        qs.stringifyUrl({ url: pathname || '/', query: updatedQuery }, { skipNull: true, skipEmptyString: true }),
        { scroll: false }
        );
        
        axios.post('/api/reservations', {
            totalPrice,
            startDate: format(dateRange.startDate!, 'yyyy-MM-dd'),
            endDate: format(dateRange.endDate!, 'yyyy-MM-dd'),
            listingId: listing?.id,
            selectedTime,
            guestCount,
          })
            .then(() => {
                toast.success('Listing reserved!', {
                    iconTheme: {
                        primary: '#2200ffff',
                        secondary: '#fff',
                    }
                });
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
        selectedTime,
        guestCount
    ]);

    const handleDateChange = (value: Range) => {
        setDateRange(value);
        setDateDirty(true); // ✅ mark that user changed date
        };

        const handleGuestChange = (value: number) => {
        setGuestCount(value);
        setGuestsDirty(true); // ✅ mark that user changed guests
    };

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
                  userImage: data.image || null,
                };
              } catch (err) {
                console.warn(`Failed to fetch image for ${review.userName}`, err);
                return {
                  ...review,
                  userImage: null,
                };
              }
            })
          );
      
          setReviews(updatedReviews);
        };
      
        if (reviews.length > 0) fetchUserImages();
    }, [reviews]);

    useEffect(() => {
        if (!dateDirty && !guestsDirty) return; // ✅ do nothing until user interacts

        const currentQuery = params ? qs.parse(params.toString()) : {};
        const updatedQuery: any = { ...currentQuery };

        if (dateDirty) {
            updatedQuery.startDate = dateRange.startDate ? formatISO(dateRange.startDate as Date) : undefined;
            updatedQuery.endDate   = dateRange.endDate   ? formatISO(dateRange.endDate   as Date) : undefined;
        }
        if (guestsDirty) {
            updatedQuery.guestCount = guestCount;
            updatedQuery.guests = String(guestCount); 
        }

        router.replace(
            qs.stringifyUrl({ url: pathname || '/', query: updatedQuery }, { skipNull: true, skipEmptyString: true }),
            { scroll: false } // ✅ prevent jump to top
        );
        }, [
        dateDirty, guestsDirty,
        dateRange.startDate, dateRange.endDate,
        guestCount, params, pathname, router
    ]);

    // ListingClient.tsx — add after your useState hooks
    useEffect(() => {
        const s = params?.get('startDate');
        const e = params?.get('endDate');
        const g = params?.get('guestCount') ?? params?.get('guests');

        if (s) setDateRange(prev => ({ ...prev, startDate: new Date(s) }));
        if (e) setDateRange(prev => ({ ...prev, endDate: new Date(e) }));
        if (g) {
            const n = parseInt(g, 10);
            if (!Number.isNaN(n) && n > 0) setGuestCount(n);
        }
        // do NOT set dateDirty/guestsDirty here
    }, [params]);


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

                    <button
                        onClick={() => {
                            // 🔐 Check auth first
                            if (!currentUser) {
                            loginModal.onOpen();
                            return;
                            }
    
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
                            messenger.openChat(recipient);
                            }
                        }}
                        className="text-md text-white bg-black hover:bg-neutral-800 p-4 rounded-xl transition font-normal mt-1"
                        >
                        Text @{listing.user?.name?.split(' ')[0] ?? 'Host'}
                    </button>

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
                                // onChangeDate={(value) => setDateRange(value)}
                                onChangeDate={handleDateChange}
                                dateRange={dateRange}
                                onSubmit={onCreateReservation}
                                disabled={isLoading}
                                disabledDates={disabledDates}
                                bookedSlots={bookedSlots}
                                selectedTime={selectedTime}
                                onTimeChange={setSelectedTime}
                                maxGuests={listing.guestCount}
                                guestCount={guestCount}
                                // onGuestCountChange={setGuestCount}
                                onGuestCountChange={handleGuestChange} 
                                averageRating={averageRating}
                                reviewCount={reviews.length}
                                categoryLabel={category?.label}
                            />
                            </div>
                        </div>
                    </div>
                    <div>

                    <hr />

                    <div className="pl-6 mt-10">
                        <h1 className="md:text-2xl text-sm font-semibold">Stories from the Guestbook</h1>
                        </div>

                    {reviews.length > 0 && (
                        <div className="mt-1 md:col-span-7">
                            {/* Overall Rating */}
                            <div className="flex items-center gap-2 mb-4 pl-6">
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

                            <div className="pt-2 pb-2">
                                {/* <hr /> */}
                            </div>
                            
                            {/* Individual Reviews */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-4">
                            {reviews.slice(0, 6).map((review, i) => (
                                <div key={i} className="rounded-2xl p-8 shadow-md hover:shadow-lg transition">
                                {/* Rating Stars */}
                                <div className="flex gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`text-lg ${star <= review.rating ? 'text-[#2200ffff]' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </span>
                                    ))}
                                </div>

                                {/* Comment */}
                                <p className="text-neutral-700 text-justify">{review.comment}</p>

                                {/* User info + date */}
                                {/* <div className="flex items-center gap-3 mt-4">
                                    {review.userImage && (
                                    <Avatar src={review.userImage ?? '/images/placeholder.jpg'} name={review.userName} />
                                    )}
                                    <div>
                                    <p className="text-sm font-semibold text-neutral-800">{review.userName}</p>
                                    <p className="text-xs text-neutral-500">
                                        {new Date(review.createdAt).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                                    </p>
                                    </div>
                                </div> */}
                                {/* User info + date */}
                                <div className="flex items-center gap-3 mt-4">
                                {review.userImage ? (
                                    <Avatar src={review.userImage} name={review.userName} size={30} />
                                ) : (
                                    <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-black"
                                    >
                                    {review.userName?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-semibold text-neutral-800">{review.userName}</p>
                                    <p className="text-xs text-neutral-500">
                                    {new Date(review.createdAt).toLocaleString('en-US', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
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
                                Show all {reviews.length} reviews
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
