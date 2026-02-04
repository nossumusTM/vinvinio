// 'use client';

// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useCallback, useMemo, useEffect, useState, useRef } from "react";
// import type { TouchEvent } from "react";
// import Avatar from "../Avatar";
// import { format } from 'date-fns';

// import { motion, AnimatePresence } from 'framer-motion';

// import qs from 'query-string';
// import { useSearchParams } from 'next/navigation';
// import { hrefForListing } from "@/app/libs/links";
// import useCountries from "@/app/hooks/useCountries";
// import { CountrySelectValue } from "../inputs/CountrySelect";

// import {
//   SafeListing,
//   SafeReservation,
//   SafeUser
// } from "@/app/types";

// import HeartButton from "../HeartButton";
// import Button from "../Button";

// // interface ListingCardProps {
// //   data: SafeListing;
// //   reservation?: SafeReservation;
// //   onAction?: (id: string) => void;
// //   disabled?: boolean;
// //   actionLabel?: string;
// //   actionId?: string;
// //   currentUser?: SafeUser | null;
// // };

// interface ListingCardProps {
//   data: SafeListing & { user: SafeUser }; // 👈 Add `user` to data
//   reservation?: SafeReservation;
//   onAction?: (id: string) => void;
//   disabled?: boolean;
//   actionLabel?: string;
//   actionId?: string;
//   currentUser?: SafeUser | null;
//   compact?: boolean; // ⬅️ ADD
// };

// const ListingCard: React.FC<ListingCardProps> = ({
//   data,
//   reservation,
//   onAction,
//   disabled,
//   actionLabel,
//   actionId = '',
//   currentUser,
//   compact = false,
// }) => {
//   const router = useRouter();
//   const { getByValue } = useCountries();
//   const [reviews, setReviews] = useState<{
//     rating: number;
//     comment: string;
//     userName: string;
//     userImage?: string;
//     createdAt: string;
//   }[]>([]);

//   const params = useSearchParams();

//   const listingHref = useMemo(() => {
//     const current = params ? qs.parse(params.toString()) : {};
//     const baseUrl = hrefForListing(data);
//     return qs.stringifyUrl(
//       { url: baseUrl, query: current },
//       { skipNull: true, skipEmptyString: true }
//     );
//   }, [
//     params,
//     data.id,
//     data.slug,
//     data.primaryCategory,
//     JSON.stringify(data.category ?? [])
//   ]);

//   const [isHovered, setIsHovered] = useState(false);
//   const [isMobile, setIsMobile] = useState(false);
//   const [activeImageIndex, setActiveImageIndex] = useState(0);
//   const touchStartXRef = useRef<number | null>(null);
//   const touchStartYRef = useRef<number | null>(null);
//   const isSwipingRef = useRef(false);
//   const hasSwipedRef = useRef(false);
//   const swipeResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   // const images: string[] = useMemo(
//   //   () => (Array.isArray(data.imageSrc) ? data.imageSrc.filter(src => !/\.(mp4|webm|ogg)$/i.test(src)) : []),
//   //   [data.imageSrc]
//   // );
//   const { images, videos } = useMemo(() => {
//     const imageArr = Array.isArray(data.imageSrc)
//       ? data.imageSrc.filter(src => !/\.(mp4|webm|ogg)$/i.test(src))
//       : [];
//     const videoArr = Array.isArray(data.imageSrc)
//       ? data.imageSrc.filter(src => /\.(mp4|webm|ogg)$/i.test(src))
//       : [];
//     return { images: imageArr, videos: videoArr };
//   }, [data.imageSrc]);  

//   const coverImageIndex = useMemo(() => {
//     return Math.floor(Math.random() * images.length);
//   }, [images]);  
  
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);
//   const randomHeight = useMemo(() => Math.floor(Math.random() * 1) + 400, []);

//   const coverMedia = useMemo(() => {
//     const roll = Math.random();
//     if (videos.length > 0) {
//     // if (roll < 0.05 && videos.length > 0) {
//       const randomVideo = videos[Math.floor(Math.random() * videos.length)];
//       return { type: 'video', src: randomVideo };
//     }
//     if (images.length > 0) {
//       const randomImage = images[Math.floor(Math.random() * images.length)];
//       return { type: 'image', src: randomImage };
//     }
//     return { type: 'image', src: '/placeholder.jpg' }; // Fallback
//   }, [images, videos]);  

//   console.log('coverMedia', coverMedia);

//   const goPrev = useCallback(() => {
//     if (images.length > 0) {
//       setActiveImageIndex((i) => (i - 1 + images.length) % images.length);
//     }
//   }, [images.length]);

//   const goNext = useCallback(() => {
//     if (images.length > 0) {
//       setActiveImageIndex((i) => (i + 1) % images.length);
//     }
//   }, [images.length]);

//   const clearSwipeReset = useCallback(() => {
//     if (swipeResetTimeoutRef.current) {
//       clearTimeout(swipeResetTimeoutRef.current);
//       swipeResetTimeoutRef.current = null;
//     }
//   }, []);

//   const handleTouchStart = useCallback(
//     (event: TouchEvent<HTMLDivElement>) => {
//       setIsHovered(true);
//       clearSwipeReset();
//       const touch = event.touches[0];
//       touchStartXRef.current = touch.clientX;
//       touchStartYRef.current = touch.clientY;
//       isSwipingRef.current = false;
//       hasSwipedRef.current = false;
//     },
//     [clearSwipeReset]
//   );

//   const handleTouchMove = useCallback(
//     (event: TouchEvent<HTMLDivElement>) => {
//       if (touchStartXRef.current === null || touchStartYRef.current === null) {
//         return;
//       }

//       const touch = event.touches[0];
//       const deltaX = touch.clientX - touchStartXRef.current;
//       const deltaY = touch.clientY - touchStartYRef.current;

//       if (Math.abs(deltaX) < 20 || Math.abs(deltaX) < Math.abs(deltaY)) {
//         return;
//       }

//       event.preventDefault();
//       event.stopPropagation();

//       if (images.length <= 1) {
//         return;
//       }

//       isSwipingRef.current = true;

//       if (hasSwipedRef.current) {
//         return;
//       }

//       if (deltaX > 0) {
//         goPrev();
//       } else if (deltaX < 0) {
//         goNext();
//       }

//       hasSwipedRef.current = true;
//     },
//     [goNext, goPrev, images.length]
//   );

//   const handleTouchEnd = useCallback(() => {
//     setIsHovered(false);
//     touchStartXRef.current = null;
//     touchStartYRef.current = null;
//     hasSwipedRef.current = false;
//     clearSwipeReset();
//     swipeResetTimeoutRef.current = setTimeout(() => {
//       isSwipingRef.current = false;
//       swipeResetTimeoutRef.current = null;
//     }, 250);
//   }, [clearSwipeReset]);

//   const handleTouchCancel = useCallback(() => {
//     setIsHovered(false);
//     touchStartXRef.current = null;
//     touchStartYRef.current = null;
//     isSwipingRef.current = false;
//     hasSwipedRef.current = false;
//     clearSwipeReset();
//   }, [clearSwipeReset]);

//   const handleCardClick = useCallback(() => {
//     if (isSwipingRef.current) {
//       return;
//     }
//     router.push(listingHref);
//   }, [listingHref, router]);

//   // useEffect(() => {
//   //   if (!isHovered || images.length <= 1) return;
  
//   //   intervalRef.current = setInterval(() => {
//   //     setActiveImageIndex((prevIndex) => (prevIndex + 1) % images.length);
//   //   }, 1500);
  
//   //   return () => {
//   //     clearInterval(intervalRef.current!);
//   //     intervalRef.current = null;
//   //     setActiveImageIndex(0);
//   //   };
//   // }, [isHovered, images.length]);   

// //   useEffect(() => {
// //   // disable auto-advance on hover
// //   if (!isHovered) setActiveImageIndex(0);
// // }, [isHovered]);

//   const hasFetched = useRef(false);

//   const handleCancel = useCallback(
//     (e: React.MouseEvent<HTMLButtonElement>) => {
//       e.stopPropagation();
//       if (disabled) return;
//       onAction?.(actionId);
//     },
//     [disabled, onAction, actionId]
//   );

//   const price = useMemo(() => {
//     return reservation ? reservation.totalPrice : data.price;
//   }, [reservation, data.price]);

//   const primaryCategory = useMemo(() => {
//     if (Array.isArray(data.category)) {
//       return data.category[0];
//     }

//     return data.category;
//   }, [data.category]);

//   const location = useMemo(() => {
//     if (!data.locationValue) {
//       return undefined;
//     }

//     const directMatch = getByValue(data.locationValue) as CountrySelectValue | undefined;
//     if (directMatch) {
//       return directMatch;
//     }

//     const segments = data.locationValue.split('-');
//     if (segments.length < 2) {
//       return undefined;
//     }

//     const countryCode = segments.pop();
//     if (!countryCode) {
//       return undefined;
//     }

//     const fallbackCountry = getByValue(countryCode.toUpperCase()) as CountrySelectValue | undefined;
//     if (!fallbackCountry) {
//       return undefined;
//     }

//     const citySlug = segments.join('-');
//     const formattedCity = citySlug
//       ? citySlug
//           .split('-')
//           .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
//           .join(' ')
//       : fallbackCountry.city;

//     return {
//       ...fallbackCountry,
//       city: formattedCity || fallbackCountry.city,
//     } as CountrySelectValue;
//   }, [data.locationValue, getByValue]);

//   const locationCode = useMemo(() => {
//     const rawCode = location?.value ?? data.locationValue;
//     if (!rawCode) {
//       return undefined;
//     }

//     const parts = rawCode.split('-');
//     const lastSegment = parts[parts.length - 1];
//     return lastSegment ? lastSegment.toLowerCase() : undefined;
//   }, [location?.value, data.locationValue]);

//   const locationFlagSrc = locationCode ? `/flags/${locationCode}.svg` : undefined;

//   // const reservationDate = useMemo(() => {
//   //   if (!reservation) return null;
//   //   const start = new Date(reservation.startDate);
//   //   const end = new Date(reservation.endDate);
//   //   return `${format(start, 'PP')} - ${format(end, 'PP')}`;
//   // }, [reservation]);

//   const reservationDate = useMemo(() => {
//     if (!reservation) return null;
//     const start = new Date(reservation.startDate);
//     const time24 = reservation.time; // e.g., "14:30"
  
//     if (!time24) return format(start, 'PP'); // fallback
  
//     // Convert to AM/PM
//     const [hourStr, minuteStr] = time24.split(':');
//     const hour = parseInt(hourStr, 10);
//     const minute = minuteStr.padStart(2, '0');
//     const period = hour >= 12 ? 'PM' : 'AM';
//     const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  
//     return `${format(start, 'PP')} at ${hour12}:${minute} ${period}`;
//   }, [reservation]);      

//   useEffect(() => {
//     if (hasFetched.current) return;
//     hasFetched.current = true;

//     const fetchReviews = async () => {
//       try {
//         const res = await fetch('/api/reviews/get-by-listing', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ listingId: data.id }),
//         });
//         const result = await res.json();
//         setReviews(result || []);
//       } catch (err) {
//         console.error('Failed to fetch reviews:', err);
//       }
//     };

//     fetchReviews();
//   }, [data.id]);

//   useEffect(() => {
//     setActiveImageIndex(Math.floor(Math.random() * images.length));
//   }, [images.length]);  

//   useEffect(() => {
//     const mq = window.matchMedia?.('(pointer: coarse)');
//     const update = () => setIsMobile((mq && mq.matches) || window.innerWidth < 1024);

//     update();
//     mq?.addEventListener?.('change', update);
//     window.addEventListener('resize', update);

//     return () => {
//       mq?.removeEventListener?.('change', update);
//       window.removeEventListener('resize', update);
//     };
//   }, []);

//   useEffect(() => {
//     return () => {
//       clearSwipeReset();
//     };
//   }, [clearSwipeReset]);

//   return (
//     <div
//       onClick={handleCardClick}
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//       onTouchStart={handleTouchStart}
//       onTouchMove={handleTouchMove}
//       onTouchEnd={handleTouchEnd}
//       onTouchCancel={(event) => {
//         event.stopPropagation();
//         handleTouchCancel();
//       }}
//       className="col-span-1 cursor-pointer group pl-10 pr-10 p-10 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl"
//     >
//       <div className="flex flex-col gap-2 w-full">
//       <div
//         className="w-full relative rounded-xl overflow-hidden transition-all duration-500"
//         style={{ minHeight: 'auto', maxHeight: `${randomHeight}px`, height: `${randomHeight}px` }}
//         >
//           {/* {images.map((img: string, i: number) => (
//             <Image
//               key={i}
//               fill
//               className={`object-cover h-full w-full absolute top-0 left-0 rounded-xl transition-opacity duration-700 ease-in-out ${i === activeImageIndex ? 'opacity-100' : 'opacity-0'}`}
//               src={img}
//               alt={`Listing ${i}`}
//             />
//           ))} */}
//           {/* {coverMedia.type === 'video' ? (
//               <video
//                 src={coverMedia.src}
//                 className="absolute top-0 left-0 w-full h-full object-cover rounded-xl"
//                 autoPlay
//                 loop
//                 muted
//                 playsInline
//               />
//             ) : (
//               images.map((img: string, i: number) => (
//                 <Image
//                   key={i}
//                   fill
//                   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//                   className={`object-cover h-full w-full absolute top-0 left-0 rounded-xl transition-opacity duration-700 ease-in-out ${
//                     i === activeImageIndex ? 'opacity-100' : 'opacity-0'
//                   }`}
//                   src={img}
//                   alt={`Listing ${i}`}
//                   priority
//                 />
//               ))
//             )} */}
//             {coverMedia.type === 'video' && (
//               <video
//                 key={coverMedia.src}
//                 src={coverMedia.src}
//                 className="absolute top-0 left-0 w-full h-full object-cover rounded-xl"
//                 autoPlay
//                 loop
//                 muted
//                 playsInline
//                 style={{ zIndex: 1 }}
//               />
//             )}

//             {coverMedia.type === 'image' &&
//               images.map((img: string, i: number) => (
//                 <Image
//                   key={i}
//                   fill
//                   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//                   className={`object-cover h-full w-full absolute top-0 left-0 rounded-xl transition-opacity duration-700 ease-in-out ${
//                     i === activeImageIndex ? 'opacity-100' : 'opacity-0'
//                   }`}
//                   src={img}
//                   alt={`Listing ${i}`}
//                   priority
//                 />
//             ))}


//           <div className="absolute top-3 right-3">
//             <HeartButton listingId={data.id} currentUser={currentUser} />
//           </div>

//           {/* ⬇️ Navigation arrows - visible only on hover */}
//           <AnimatePresence>
//           {(isMobile || isHovered) && coverMedia.type === 'image' && images.length > 1 && (
//             <motion.div
//               key="arrow-controls"
//               initial={{ opacity: 0, y: 4 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 4 }}
//               transition={{ duration: 0.25, ease: "easeInOut" }}
//               className="absolute bottom-3 inset-x-0 z-30 flex items-center justify-center gap-3 pointer-events-auto"
//             >
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   goPrev();
//                 }}
//                 className="p-2 border border-white/30 hover:border-white rounded-full bg-white/0 backdrop-blur-sm transition"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
//                   <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2"
//                         strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//               </button>

//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   goNext();
//                 }}
//                 className="p-2 border border-white/30 hover:border-white rounded-full bg-white/0 backdrop-blur-sm transition"
//               >
//                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
//                   <path d="M9 6l6 6-6 6" stroke="white" strokeWidth="2"
//                         strokeLinecap="round" strokeLinejoin="round"/>
//                 </svg>
//               </button>
//             </motion.div>
//           )}
//         </AnimatePresence>
//         </div>

//         {reviews.length > 0 && (
//           <div className="pt-2 flex items-center gap-2 text-sm text-neutral-600">
//             <svg width="16" height="16" viewBox="0 0 24 24" fill="#2200ffff">
//               <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
//                       14.81 8.63 12 2 9.19 8.63 2 9.24 
//                       7.46 13.97 5.82 21 12 17.27z" />
//             </svg>
//             <span className="font-medium">
//               {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}
//             </span>
//           </div>
//         )}

//         <div className="flex items-center gap-2 pt-1 text-neutral-500 text-sm flex-wrap">
//           {reservationDate ? (
//             <span>{reservationDate}</span>
//           ) : (
//             <>
//               {primaryCategory && (
//                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-neutral-300 bg-white text-neutral-700 text-xs font-medium tracking-wide">
//                   {primaryCategory}
//                 </span>
//               )}
//               <span className="flex items-center border border-neutral-300 px-2.5 py-0.5 rounded-full gap-2 text-xs text-neutral-700">
//                 {locationFlagSrc && (
//                   <Image
//                     src={locationFlagSrc}
//                     alt={location?.label ?? 'Country flag'}
//                     width={20}
//                     height={14}
//                     className="h-3 w-3 rounded-sm object-cover"
//                   />
//                 )}
//                 <span>
//                   {location
//                     ? 'city' in location
//                       ? `${location.city}, ${location.label}`
//                       : location.label
//                     : 'Unknown location'}
//                 </span>
//               </span>
//             </>
//           )}
//         </div>

//         <div className="font-semibold text-lg px-1">{data.title}</div>

//         {/* {data.user && (
//           <div className="flex items-center gap-2 pt-2">
//             <Avatar src={data.user.image} name={data.user.name} size={40} />
//             <div className="flex text-sm flex-row justify-start gap-2 font-normal">
//               <div className="font-semibold border-b border-neutral-500">
//                 {data.user.name}
//               </div>
//             </div>
//           </div>
//         )} */}

//         <hr />

//         <div className="flex flex-row items-center gap-1 ml-3 mt-1">
//           <div className="font-semibold">€{price}</div>
//           {!reservation && <div className="font-normal text-xs">/ PER PERSON</div>}
//         </div>

//         {onAction && actionLabel && (
//           <Button
//             disabled={disabled}
//             small
//             label={actionLabel}
//             onClick={handleCancel}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default ListingCard;

'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import type { TouchEvent } from "react";
import Avatar from "../Avatar";
import { format } from 'date-fns';

import { motion, AnimatePresence } from 'framer-motion';

import qs from 'query-string';
import { useSearchParams } from 'next/navigation';
import { hrefForListing } from "@/app/(marketplace)/libs/links";
import useCountries from "@/app/(marketplace)/hooks/useCountries";
import { CountrySelectValue } from "../inputs/CountrySelect";
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import { getDisplayPricing, computePricingForGuests } from "@/app/(marketplace)/libs/pricingDisplay";
import { categories } from "@/app/(marketplace)/components/navbar/Categories";

import {
  SafeListing,
  SafeReservation,
  SafeUser
} from "@/app/(marketplace)/types";

import HeartButton from "../HeartButton";
import Button from "../Button";

interface ListingCardProps {
  data: SafeListing & { user: SafeUser };
  reservation?: SafeReservation;
  onAction?: (id: string) => void;
  disabled?: boolean;
  actionLabel?: string;
  actionId?: string;
  currentUser?: SafeUser | null;
  compact?: boolean;
};

const ListingCard: React.FC<ListingCardProps> = ({
  data,
  reservation,
  onAction,
  disabled,
  actionLabel,
  actionId = '',
  currentUser,
  compact = false,
}) => {
  const router = useRouter();
  const { getByValue } = useCountries();
  const { formatConverted } = useCurrencyFormatter();
  const [reviews, setReviews] = useState<{
    rating: number;
    comment: string;
    userName: string;
    userImage?: string;
    createdAt: string;
  }[]>([]);

  const params = useSearchParams();

  const listingHref = useMemo(() => {
    const current = params ? qs.parse(params.toString()) : {};
    const baseUrl = hrefForListing(data);
    return qs.stringifyUrl(
      { url: baseUrl, query: current },
      { skipNull: true, skipEmptyString: true }
    );
  }, [
    params,
    data.id,
    data.slug,
    data.primaryCategory,
    JSON.stringify(data.category ?? [])
  ]);

  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isSwipingRef = useRef(false);
  const hasSwipedRef = useRef(false);
  const swipeResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { images, videos } = useMemo(() => {
    const imageArr = Array.isArray(data.imageSrc)
      ? data.imageSrc.filter(src => !/\.(mp4|webm|ogg)$/i.test(src))
      : [];
    const videoArr = Array.isArray(data.imageSrc)
      ? data.imageSrc.filter(src => /\.(mp4|webm|ogg)$/i.test(src))
      : [];
    return { images: imageArr, videos: videoArr };
  }, [data.imageSrc]);  

  const coverImageIndex = useMemo(() => {
    return Math.floor(Math.random() * images.length);
  }, [images]);  
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const randomHeight = useMemo(() => Math.floor(Math.random() * 1) + 400, []);
  const mediaHeight = useMemo(
    () => (compact ? Math.max(180, Math.floor(randomHeight / 2)) : randomHeight),
    [compact, randomHeight]
  );

  const coverMedia = useMemo(() => {
    const roll = Math.random();
    if (videos.length > 0) {
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      return { type: 'video', src: randomVideo };
    }
    if (images.length > 0) {
      const randomImage = images[Math.floor(Math.random() * images.length)];
      return { type: 'image', src: randomImage };
    }
    return { type: 'image', src: '/placeholder.jpg' };
  }, [images, videos]);  

  // console.log('coverMedia', coverMedia);

  const goPrev = useCallback(() => {
    if (images.length > 0) {
      setActiveImageIndex((i) => (i - 1 + images.length) % images.length);
    }
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length > 0) {
      setActiveImageIndex((i) => (i + 1) % images.length);
    }
  }, [images.length]);

  const clearSwipeReset = useCallback(() => {
    if (swipeResetTimeoutRef.current) {
      clearTimeout(swipeResetTimeoutRef.current);
      swipeResetTimeoutRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      setIsHovered(true);
      clearSwipeReset();
      const touch = event.touches[0];
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
      isSwipingRef.current = false;
      hasSwipedRef.current = false;
    },
    [clearSwipeReset]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (touchStartXRef.current === null || touchStartYRef.current === null) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const deltaY = touch.clientY - touchStartYRef.current;

      if (Math.abs(deltaX) < 20 || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (images.length <= 1) {
        return;
      }

      isSwipingRef.current = true;

      if (hasSwipedRef.current) {
        return;
      }

      if (deltaX > 0) {
        goPrev();
      } else if (deltaX < 0) {
        goNext();
      }

      hasSwipedRef.current = true;
    },
    [goNext, goPrev, images.length]
  );

  const handleTouchEnd = useCallback(() => {
    setIsHovered(false);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    hasSwipedRef.current = false;
    clearSwipeReset();
    swipeResetTimeoutRef.current = setTimeout(() => {
      isSwipingRef.current = false;
      swipeResetTimeoutRef.current = null;
    }, 250);
  }, [clearSwipeReset]);

  const handleTouchCancel = useCallback(() => {
    setIsHovered(false);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isSwipingRef.current = false;
    hasSwipedRef.current = false;
    clearSwipeReset();
  }, [clearSwipeReset]);

  const handleCardClick = useCallback(() => {
    if (isSwipingRef.current) {
      return;
    }
    router.push(listingHref);
  }, [listingHref, router]);

  const hasFetched = useRef(false);

  const handleCancel = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (disabled) return;
      onAction?.(actionId);
    },
    [disabled, onAction, actionId]
  );

  const basePricing = useMemo(() => getDisplayPricing(data), [data]);

  const reservationPricing = useMemo(
    () => (reservation ? computePricingForGuests(data, reservation.guestCount ?? 1) : null),
    [data, reservation]
  );

  const price = useMemo(() => {
    if (reservation) {
      return reservation.totalPrice ?? reservationPricing?.totalPrice ?? basePricing.totalPrice;
    }
    return basePricing.unitPrice;
  }, [reservation, reservationPricing?.totalPrice, basePricing.totalPrice, basePricing.unitPrice]);

  const priceSuffix = useMemo(() => {
    if (reservation) return '';
    return basePricing.suffix.toUpperCase();
  }, [reservation, basePricing.suffix]);

  const priceDescriptor = reservation ? undefined : basePricing.descriptor;

  const formattedPrice = useMemo(() => formatConverted(price), [formatConverted, price]);

  const primaryCategory = useMemo(() => {
    if (Array.isArray(data.category)) {
      return data.category[0];
    }

    return data.category;
  }, [data.category]);

  const categoryMeta = useMemo(
    () => categories.find((category) => category.label === primaryCategory),
    [primaryCategory]
  );
  const CategoryIcon = categoryMeta?.icon;

  const location = useMemo(() => {
    if (!data.locationValue) {
      return undefined;
    }

    const directMatch = getByValue(data.locationValue) as CountrySelectValue | undefined;
    if (directMatch) {
      return directMatch;
    }

    const segments = data.locationValue.split('-');
    if (segments.length < 2) {
      return undefined;
    }

    const countryCode = segments.pop();
    if (!countryCode) {
      return undefined;
    }

    const fallbackCountry = getByValue(countryCode.toUpperCase()) as CountrySelectValue | undefined;
    if (!fallbackCountry) {
      return undefined;
    }

    const citySlug = segments.join('-');
    const formattedCity = citySlug
      ? citySlug
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      : fallbackCountry.city;

    return {
      ...fallbackCountry,
      city: formattedCity || fallbackCountry.city,
    } as CountrySelectValue;
  }, [data.locationValue, getByValue]);

  const locationCode = useMemo(() => {
    const rawCode = location?.value ?? data.locationValue;
    if (!rawCode) {
      return undefined;
    }

    const parts = rawCode.split('-');
    const lastSegment = parts[parts.length - 1];
    return lastSegment ? lastSegment.toLowerCase() : undefined;
  }, [location?.value, data.locationValue]);

  const locationFlagSrc = locationCode ? `/flags/${locationCode}.svg` : undefined;

  const reservationDate = useMemo(() => {
    if (!reservation) return null;
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

  useEffect(() => {
    setActiveImageIndex(Math.floor(Math.random() * images.length));
  }, [images.length]);  

  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: coarse)');
    const update = () => setIsMobile((mq && mq.matches) || window.innerWidth < 1024);

    update();
    mq?.addEventListener?.('change', update);
    window.addEventListener('resize', update);

    return () => {
      mq?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearSwipeReset();
    };
  }, [clearSwipeReset]);

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={(event) => {
        event.stopPropagation();
        handleTouchCancel();
      }}
      className={`col-span-1 cursor-pointer group shadow-md duration-300 rounded-2xl
                  ${compact ? 'p-4' : 'p-8'}`}
    >
      <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2'} w-full`}>
        <div
          className="w-full relative rounded-xl overflow-hidden transition-all duration-500"
          style={{ minHeight: 'auto', maxHeight: `${mediaHeight}px`, height: `${mediaHeight}px` }}
        >
          {coverMedia.type === 'video' && (
            <video
              key={coverMedia.src}
              src={coverMedia.src}
              className="absolute top-0 left-0 w-full h-full object-cover rounded-xl"
              autoPlay
              loop
              muted
              playsInline
              style={{ zIndex: 1 }}
            />
          )}

          {coverMedia.type === 'image' &&
            images.map((img: string, i: number) => (
              <Image
                key={i}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-cover h-full w-full absolute top-0 left-0 rounded-xl transition-opacity duration-700 ease-in-out ${
                  i === activeImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                src={img}
                alt={`Listing ${i}`}
                priority
              />
          ))}

          {/* <div className="absolute top-3 right-3">

            <HeartButton listingId={data.id} currentUser={currentUser} />

          </div> */}

          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            {/* <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-neutral-800 shadow">
              <span className="text-[10px] tracking-[0.18em] text-neutral-500">VIN POINT</span>
              <span className="text-sm text-black">{Number(data.punti ?? 0)}</span>
            </span> */}
            <HeartButton listingId={data.id} currentUser={currentUser} />
          </div>

          {/* ⬇️ Navigation arrows - visible only on hover */}
          <AnimatePresence>
            {(isMobile || isHovered) && coverMedia.type === 'image' && images.length > 1 && (
              <motion.div
                key="arrow-controls"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute bottom-3 inset-x-0 z-30 flex items-center justify-center gap-3 pointer-events-auto"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="p-2 shadow-sm hover:shadow-md items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="p-2 shadow-sm hover:shadow-md rounded-full bg-black/20 items-center justify-center backdrop-blur-sm transition"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="white" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {reviews.length > 0 && (
          <div className="pt-2 flex items-center gap-2 text-sm text-neutral-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#2200ffff">
              <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
                      14.81 8.63 12 2 9.19 8.63 2 9.24 
                      7.46 13.97 5.82 21 12 17.27z" />
            </svg>
            <span className="font-medium">
              {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 text-neutral-500 text-sm flex-wrap">
          {reservationDate ? (
            <span>{reservationDate}</span>
          ) : (
            <>
              <div className="flex flex-row items-start mb-1.5 gap-2 pt-1 text-neutral-500 text-xs md:text-sm flex-nowrap overflow-hidden px-1 py-1">
                {primaryCategory && (
                  <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded-lg shadow-sm bg-white text-neutral-700 text-[11px] md:text-xs font-medium tracking-wide whitespace-nowrap">
                    {CategoryIcon && <CategoryIcon className="h-3 w-3" aria-hidden />}
                    <span>{primaryCategory}</span>
                  </span>
                )}
                <span className="flex items-center shadow-sm px-1 py-0.5 rounded-lg gap-1.5 text-[11px] md:text-xs text-neutral-700 whitespace-nowrap overflow-hidden">

                  {/* Hide flag + country when compact (mobile Grid 2) */}
                  {locationFlagSrc && (
                    <Image
                      src={locationFlagSrc}
                      alt={location?.label ?? 'Country flag'}
                      width={20}
                      height={14}
                      className="h-3 w-4 rounded object-cover"
                    />
                  )}

                  <span className="truncate max-w-[55vw] md:max-w-none font-normal">
                    {location
                      ? compact
                        // mobile Grid 2 → show ONLY city
                        ? ('city' in location ? `${location.city}, ${location.label}` : location.label)
                        // normal → city + country
                        : ('city' in location ? `${location.city}, ${location.label}` : location.label)
                      : 'Unknown location'}
                  </span>

                </span>
              </div>
            </>
          )}
        </div>

        <div className={`font-semibold px-1 ${compact ? 'text-xs md:text-sm' : 'text-base md:text-lg'} leading-tight`}>
          {data.title}
        </div>

       <hr />

        <div className={`flex flex-row items-center gap-1 ${compact ? 'ml-2 mt-1' : 'ml-1 mt-1'}`}>
          <div className={`font-semibold ${compact ? 'text-sm md:text-base' : 'text-base md:text-lg'}`}>{formattedPrice}</div>
          {!reservation && (
            <div className="font-normal text-[10px] md:text-xs">{priceSuffix}</div>
          )}
        </div>
        {!reservation && priceDescriptor && (
          <div className={`ml-1 text-[10px] md:text-xs text-neutral-500 ${compact ? 'mt-0' : 'mt-[2px]'}`}>
            {priceDescriptor}
          </div>
        )}

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