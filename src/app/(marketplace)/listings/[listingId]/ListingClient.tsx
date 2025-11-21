'use client';

import axios from "axios";
import { useCallback, useEffect, useMemo, useState, useRef, type ReactNode } from "react";

import qs from 'query-string';
import { useSearchParams, usePathname } from 'next/navigation';
import { formatISO } from 'date-fns';

import { toast } from "react-hot-toast";
import { Range } from "react-date-range";
import { useRouter } from "next/navigation";
import { differenceInDays, eachDayOfInterval } from 'date-fns';
import useMessenger from "@/app/(marketplace)/hooks/useMessager";
import Button from "@/app/(marketplace)/components/Button";
export const dynamic = 'force-dynamic';
import Heading from "@/app/(marketplace)/components/Heading";

import { format } from 'date-fns';

import useLoginModal from "@/app/(marketplace)/hooks/useLoginModal";
import { SafeListing, SafeReservation, SafeUser } from "@/app/(marketplace)/types";
import { computePricingForGuests } from "@/app/(marketplace)/libs/pricingDisplay";
import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import useCurrencyFormatter from "@/app/(marketplace)/hooks/useCurrencyFormatter";

import Container from "@/app/(marketplace)/components/Container";
import { categories } from "@/app/(marketplace)/components/navbar/Categories";
import ListingHead from "@/app/(marketplace)/components/listings/ListingHead";
import ListingInfo from "@/app/(marketplace)/components/listings/ListingInfo";
import ListingReservation from "@/app/(marketplace)/components/listings/ListingReservation";
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from "@/app/(marketplace)/components/Avatar";

import useCountries from "@/app/(marketplace)/hooks/useCountries";
import useExperienceSearchState from "@/app/(marketplace)/hooks/useExperienceSearchState";

import ReviewsModal from "@/app/(marketplace)/components/modals/ReviewModal";

const initialDateRange = {
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection'
};

type PricingTier = { minGuests: number; maxGuests: number; price: number };

type CustomPricingMeta = {
    basePrice?: number | null;
    tiers?: PricingTier[] | null;
    mode?: string | null;
} | null;

const sanitizeTier = (tier: any): PricingTier | null => {
    const min = Number(tier?.minGuests);
    const max = Number(tier?.maxGuests);
    const price = Number(tier?.price);

    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(price)) {
        return null;
    }

    const normalizedMin = Math.max(1, Math.floor(min));
    const normalizedMax = Math.max(normalizedMin, Math.floor(max));
    const normalizedPrice = Math.max(0, price);

    return {
        minGuests: normalizedMin,
        maxGuests: normalizedMax,
        price: normalizedPrice,
    };
};

const normalizeCustomPricingTiers = (value: unknown): PricingTier[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map(sanitizeTier).filter((tier): tier is PricingTier => Boolean(tier));
    }

    if (typeof value === 'object' && Array.isArray((value as any).tiers)) {
        return normalizeCustomPricingTiers((value as any).tiers);
    }

    return [];
};

const extractCustomPricingMeta = (value: unknown): CustomPricingMeta => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    return value as CustomPricingMeta;
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
    const { formatConverted } = useCurrencyFormatter();

    const [dateDirty, setDateDirty] = useState(false);
    const [guestsDirty, setGuestsDirty] = useState(false);

    const didInitFromParams = useRef(false);

    const {
        hostDescription = '',
        experienceHour = undefined,
        meetingPoint = '',
        languages = [],
        locationType = [],
        locationDescription = '',
        groupStyles = [],
        durationCategory = null,
        environments = [],
        activityForms = [],
        seoKeywords = [],
        hoursInAdvance = 0,
        availabilityRules = null,
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
            imageSrc: listing.user?.image ?? null,
            icon: found?.icon,
        };
        }, [listing.category, listing.user]);

    const [showAllReviews, setShowAllReviews] = useState(false);

    const { getByValue } = useCountries();
    const { setLocation } = useExperienceSearchState();

    const [isLoading, setIsLoading] = useState(false);
    const [totalPrice, setTotalPrice] = useState(listing.price);
    const [dateRange, setDateRange] = useState<Range>(initialDateRange);
    const [selectedTime, setSelectedTime] = useState<string>();
    const [guestCount, setGuestCount] = useState(() =>
        listing.pricingType === 'group' && listing.groupSize ? listing.groupSize : 1,
    );

    const [reviews, setReviews] = useState<{
        rating: number;
        comment: string;
        userName: string;
        userImage?: string;
        createdAt: string;
    }[]>([]);

    const messenger = useMessenger();
    const [useDarkButton, setUseDarkButton] = useState(false);

    const rawCustomPricing = listing.customPricing as unknown;
    const pricingTiers = useMemo(
        () => normalizeCustomPricingTiers(rawCustomPricing),
        [rawCustomPricing]
    );

    const sortedCustomPricingTiers = useMemo(
        () => [...pricingTiers].sort((a, b) => a.minGuests - b.minGuests),
        [pricingTiers]
    );

    const listingForPricing = useMemo(
        () => ({
            price: listing.price,
            pricingType: listing.pricingType,
            groupPrice: listing.groupPrice,
            groupSize: listing.groupSize,
            customPricing: sortedCustomPricingTiers,
            guestCount: listing.guestCount,
        }),
        [
            listing.price,
            listing.pricingType,
            listing.groupPrice,
            listing.groupSize,
            listing.guestCount,
            sortedCustomPricingTiers,
        ]
    );

    const pricing = useMemo(
        () => computePricingForGuests(listingForPricing, guestCount),
        [guestCount, listingForPricing]
    );

    const perPersonPrice = pricing.unitPrice;

    const customPricingMeta = useMemo(
        () => extractCustomPricingMeta(rawCustomPricing),
        [rawCustomPricing]
    );

    const [showPricingPopover, setShowPricingPopover] = useState(false);

    const pricingMode: 'custom' | 'group' | 'perPerson' = useMemo(() => {
        if (listing.pricingType === 'custom') return 'custom';
        if (listing.pricingType === 'group') return 'group';
        return 'perPerson';
    }, [listing.pricingType]);

    const groupFlatPrice = listing.groupPrice ?? listing.price;
    const groupGuestLimit = listing.groupSize ?? listing.guestCount;

    const baseCustomPrice = useMemo(() => {
        if (typeof customPricingMeta?.basePrice === 'number') {
            return customPricingMeta.basePrice;
        }

        return sortedCustomPricingTiers[0]?.price ?? listing.price;
    }, [customPricingMeta, listing.price, sortedCustomPricingTiers]);

    const pricingIndicator = useMemo(() => {
        switch (pricingMode) {
            case 'custom':
                return {
                    label: 'Custom pricing',
                    headline: `${formatConverted(baseCustomPrice)}+ / person`,
                    description: 'Rates adapt to your group size.',
                };
            case 'group':
                return {
                    label: 'Group pricing',
                    headline: `${formatConverted(groupFlatPrice)} total`,
                    description: `Flat rate for up to ${groupGuestLimit} guests`,
                };
            default:
                return {
                    label: 'Price per person',
                    headline: `${formatConverted(perPersonPrice)} / guest`,
                    description: 'Simple pay-per-guest rate.',
                };
        }
    }, [baseCustomPrice, formatConverted, groupFlatPrice, groupGuestLimit, perPersonPrice, pricingMode]);

    const pricingPopoverContent = useMemo<ReactNode>(() => {
        switch (pricingMode) {
            case 'custom': {
                if (sortedCustomPricingTiers.length === 0) {
                    return (
                        <p className="text-sm text-neutral-600">
                            The host will confirm custom pricing details once you share your group size.
                        </p>
                    );
                }

                return (
                    <div className="space-y-3">
                        <p className="text-sm text-neutral-600">
                            Pick a guest count and we will snap to the correct tier.
                        </p>
                        <div className="space-y-2">
                            {sortedCustomPricingTiers.map((tier) => (
                                <div
                                    key={`${tier.minGuests}-${tier.maxGuests}`}
                                    className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/80 px-4 py-2 text-sm shadow-sm"
                                >
                                    <span className="font-medium text-neutral-700">
                                        {tier.minGuests} - {tier.maxGuests} guests
                                    </span>
                                    <span className="font-semibold text-neutral-900">{formatConverted(tier.price)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
            case 'group':
                return (
                    <div className="space-y-3 text-sm text-neutral-600">
                    <p>
                        This experience uses a flat group price. The total stays the same and currently
                        covers your selection of {guestCount} guest{guestCount === 1 ? '' : 's'}.
                    </p>
                    <div className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                        Flat total
                        </p>
                        <p className="text-lg font-semibold text-neutral-900">
                        {formatConverted(groupFlatPrice)}
                        </p>
                        <p className="text-xs text-neutral-500">
                        Fixed price, up to {groupGuestLimit} guests
                        </p>
                    </div>
                    </div>
                );
            default:
                return (
                    <div className="space-y-3 text-sm text-neutral-600">
                        <p>Each guest pays the same rate. Adjust the counter to see your total update live.</p>
                        <div className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Current selection</p>
                            <p className="text-lg font-semibold text-neutral-900">{guestCount} guest{guestCount === 1 ? '' : 's'}</p>
                            <p className="text-sm text-neutral-500">{formatConverted(perPersonPrice)} per guest</p>
                            <p className="mt-2 text-base font-semibold text-neutral-900">{formatConverted(pricing.totalPrice)}</p>
                        </div>
                    </div>
                );
        }
    }, [formatConverted, guestCount, groupFlatPrice, groupGuestLimit, perPersonPrice, pricing.totalPrice, pricingMode, sortedCustomPricingTiers]);

    const hasCustomPricing = listing.pricingType === 'custom' && sortedCustomPricingTiers.length > 0;
    const [showCustomPricingDetails, setShowCustomPricingDetails] = useState(false);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest(".pricing-toggle-button") &&
                !target.closest(".pricing-popover")) {
            setShowPricingPopover(false);
            }
        };

        if (showPricingPopover) {
            document.addEventListener("mousedown", handleClick);
        }
        return () => document.removeEventListener("mousedown", handleClick);
        }, [showPricingPopover]);

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
            totalPrice: pricing.totalPrice,
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
        pricing.totalPrice,
        dateRange,
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
       if (dateRange.startDate) {
          setTotalPrice(pricing.totalPrice);
        }
    }, [dateRange.startDate, pricing.totalPrice]);

    useEffect(() => {
        if (listing.pricingType === 'group' && listing.groupSize) {
            setGuestCount(listing.groupSize);
        }
    }, [listing.groupSize, listing.pricingType]);
    
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
        const option = listing.locationValue ? getByValue(listing.locationValue) : undefined;
        if (option) {
            setLocation(option as any);
        }
      }, [getByValue, listing.locationValue, setLocation]);

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
        const currentQuery = params ? qs.parse(params.toString()) : {};
        const updatedQuery: any = { ...currentQuery };
        let shouldReplace = false;

        if (!currentQuery.startDate && dateRange.startDate) {
            updatedQuery.startDate = formatISO(dateRange.startDate as Date);
            shouldReplace = true;
        }
        if (!currentQuery.endDate && dateRange.endDate) {
            updatedQuery.endDate = formatISO(dateRange.endDate as Date);
            shouldReplace = true;
        }
        if (!currentQuery.guestCount && !currentQuery.guests) {
            updatedQuery.guestCount = guestCount;
            updatedQuery.guests = String(guestCount);
            shouldReplace = true;
        }
        if (!currentQuery.locationValue && listing.locationValue) {
            updatedQuery.locationValue = listing.locationValue;
            shouldReplace = true;
        }

        if (shouldReplace) {
            router.replace(
                qs.stringifyUrl({ url: pathname || '/', query: updatedQuery }, { skipNull: true, skipEmptyString: true }),
                { scroll: false }
            );
        }
    }, [dateRange.endDate, dateRange.startDate, guestCount, listing.locationValue, params, pathname, router]);

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

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const btn = document.querySelector(".pricing-toggle-button");
            if (!btn) return;

            const backdrop = window.getComputedStyle(btn).backgroundColor;
            const rgb = backdrop.match(/\d+/g)?.map(Number);

            if (!rgb) return;

            // relative luminance
            const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;

            setUseDarkButton(luminance < 0.55); // dark background -> use white text
        });

        observer.observe(document.body, { attributes: true, childList: true, subtree: true });

        return () => observer.disconnect();
        }, []);

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return total / reviews.length;
    }, [reviews]);     

    return (
        <>
        <Container>
            <div className="max-w-screen-lg mx-auto">
                <div className="flex flex-col gap-6">
                    <ListingHead
                        title={listing.title}
                        imageSrc={Array.isArray(listing.imageSrc) ? listing.imageSrc : [listing.imageSrc]}
                        locationValue={listing.locationValue}
                        id={listing.id}
                        currentUser={currentUser}
                        likesCount={listing.likesCount ?? 0}
                        // isLikedByCurrentUser={listing.likedByCurrentUser ?? false}
                        isLikedByCurrentUser={Boolean(listing.likedByCurrentUser)}
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
                        className="text-md text-neutral-900 shadow-md hover:shadow-lg p-4 rounded-xl transition font-normal mt-1 shadow-md"
                        >
                        Text @{listing.user?.username?.split(' ')[0] ?? 'Host'}
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-7 md:gap-10 mt-6 relative">
                        <div className="md:col-span-4 flex flex-col gap-6">
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
                                groupStyles={groupStyles}
                                durationCategory={durationCategory}
                                environments={environments}
                                activityForms={activityForms}
                                seoKeywords={seoKeywords}
                                hoursInAdvance={hoursInAdvance}
                                hostFollowersCount={listing.user.followersCount ?? 0}
                                hostAllTimeBookingCount={listing.user.allTimeBookingCount ?? 0}
                                listingLikesCount={listing.likesCount ?? 0}
                            />

                        </div>
                        <div className="order-first mb-10 md:order-last md:col-span-3">
                            <div className="md:sticky md:top-32">
                            <ListingReservation
                                listingId={listing.id}
                                price={perPersonPrice}
                                totalPrice={totalPrice}
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
                                pricingType={listing.pricingType as string}
                                groupPrice={listing.groupPrice}
                                groupSize={listing.groupSize}
                                customPricing={sortedCustomPricingTiers}
                                hoursInAdvance={hoursInAdvance ?? undefined}
                                availabilityRules={availabilityRules}
                            />
                            </div>
                        </div>
                    </div>
                    <div>

                    <hr />

                    <div id="reviews" className="pl-6 mt-10">
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

        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-baseline px-4">
            <div className="pointer-events-auto w-full max-w-xl">
                <AnimatePresence initial={false}>
                    {showPricingPopover && (
                        <motion.div
                            key="pricing-popover"
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="pricing-popover mb-3 w-full rounded-3xl border border-white/50 bg-white/95 p-5 text-neutral-900 shadow-2xl backdrop-blur"
                        >
                            <p className="text-[11px] uppercase tracking-[0.4em] text-neutral-400">{pricingIndicator.label}</p>
                            <div className="mt-3 text-sm leading-relaxed">{pricingPopoverContent}</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowPricingPopover((open) => !open)}
                    aria-expanded={showPricingPopover}
                    className="pricing-toggle-button flex w-full items-center justify-between gap-4 rounded-2xl backdrop-blur-3xl px-6 py-3 text-left text-black shadow-[0_20px_45px_rgba(0,0,0,0.35)]"
                >
                    <div className="flex-1">
                        <p className="text-[8px] font-semibold uppercase tracking-[0.5em] text-black/60">{pricingIndicator.label}</p>
                        <p className="text-md font-semibold">{pricingIndicator.headline}</p>
                        <p className="text-[10px] text-black/70">{pricingIndicator.description}</p>
                    </div>
                    <motion.span
                        aria-hidden
                        initial={{ rotate: 180 }}
                        animate={{ rotate: showPricingPopover ? 0 : 180 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg shadow-md"
                    >
                        ▾
                    </motion.span>
                </motion.button>
            </div>
        </div>
        </>
    );
}

export default ListingClient;
