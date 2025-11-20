'use client';

import dynamic from "next/dynamic";
import { IconType } from "react-icons";
import Heading from "../Heading";

import { BsTranslate } from "react-icons/bs";
import { RiUserHeartFill } from "react-icons/ri";
import { GiExtraTime } from "react-icons/gi";
import LocationDescription from '../LocationDescription';
import { FiUsers, FiCalendar, FiHeart } from 'react-icons/fi';
import NextImage from 'next/image';

import { useEffect, useState, useCallback } from "react";
import Button from "../Button";

import useCountries from "@/app/(marketplace)/hooks/useCountries";
import { SafeUser } from "@/app/(marketplace)/types";
import { profilePathForUser } from "@/app/(marketplace)/utils/profilePath";

import Avatar from "../Avatar";
import ListingCategory from "./ListingCategory";
import { useRouter } from "next/navigation";

const Map = dynamic(() => import('../Map'), {
    ssr: false
});

const MapListing = dynamic(() => import('../MapListing'), {
    ssr: false
});

interface ListingInfoProps {
    user: SafeUser,
    description: string;
    guestCount: number;
    category: {
        icon?: IconType,
        imageSrc: string | null | undefined;
        label: string;
        description: string;
    } | undefined
    locationValue: string;
    imageSrc: string[]; // ✅ Add this
    experienceHour?: number;
    hostName?: string;
    username?: string;
    hostDescription?: string;
    languages?: string[];
    meetingPoint?: string;
    locationType?: string[];
    locationDescription?: string;
    groupStyles?: string[];
    durationCategory?: string | null;
    environments?: string[];
    activityForms?: string[];
    seoKeywords?: string[];
    hoursInAdvance?: number | null;
    hostFollowersCount?: number;
    hostAllTimeBookingCount?: number;
    listingLikesCount?: number;
}

const ListingInfo: React.FC<ListingInfoProps> = ({
    user,
    description,
    guestCount,
    category,
    locationValue,
    imageSrc,
    experienceHour,
    hostDescription,
    hostName,
    username,
    languages,
    meetingPoint,
    locationType,
    locationDescription,
    groupStyles,
    durationCategory,
    environments,
    activityForms,
    seoKeywords,
    hoursInAdvance,
    hostFollowersCount = 0,
    hostAllTimeBookingCount = 0,
    listingLikesCount = 0,
}) => {
    const { getByValue } = useCountries();
    const router = useRouter();

    const coordinates = getByValue(locationValue)?.latlng

    const formatToken = (token: string) =>
        token
            .replace(/[-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());

    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [reviewCount, setReviewCount] = useState(0);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [coverLoaded, setCoverLoaded] = useState(false);

    useEffect(() => {
      let alive = true;
      (async () => {
        try {
          if (!user?.id) return;
          const res = await fetch(`/api/users/cover?userId=${encodeURIComponent(user.id)}`, {
            credentials: 'include',
            cache: 'no-store',
          });
          if (!res.ok) return;
          const data = await res.json();
          if (alive) setCoverImage(data?.coverImage ?? null);
        } catch {}
      })();
      return () => { alive = false; };
    }, [user?.id]);

    useEffect(() => {
        const fetchHostReviews = async () => {
          try {
            const res = await fetch('/api/reviews/host', {
              method: 'POST',
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hostId: user?.id }),
            });
      
            const data = await res.json();
            if (data?.length > 0) {
              const total = data.reduce((acc: number, curr: any) => acc + curr.rating, 0);
              setAverageRating(total / data.length);
              setReviewCount(data.length);
            }
          } catch (error) {
            console.error("Failed to fetch host reviews", error);
          }
        };
      
        if (user?.id) fetchHostReviews();
    }, [user?.id]);

    const handleHostNavigate = useCallback(() => {
        const profilePath = profilePathForUser(user);
        if (profilePath == null) {
            return;
        }
        router.push(profilePath);
    }, [router, user]);

    const scrollToReviews = useCallback(() => {
      const el = document.getElementById('reviews');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

   const formatItalianLocation = (value?: string | null): string => {
      if (!value) return '';
      const parts = value
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      if (parts.length === 0) return value;

      const countryIdx = parts.findIndex((p) => /italia/i.test(p));
      const postalIdx = parts.findIndex((p) => /^\d{5}$/.test(p));

      const regionIdx = (() => {
        const end = postalIdx > -1 ? postalIdx - 1 : parts.length - 1;
        for (let i = end; i >= 0; i--) {
          const p = parts[i];
          if (/municipio/i.test(p)) continue;
          if (/capitale/i.test(p)) continue;
          return i;
        }
        return -1;
      })();

      let street: string | undefined;
      let house: string | undefined;
      let poi: string | undefined;

      if (/^\d+$/.test(parts[0]) && parts[1]) {
        house = parts[0];
        street = parts[1];
      } else if (parts[0]) {
        poi = parts[0];
      }

      let city: string | undefined;
      const searchEnd = regionIdx > -1
        ? regionIdx
        : postalIdx > -1
        ? postalIdx
        : parts.length;

      for (let i = searchEnd - 1; i >= 0; i--) {
        const p = parts[i];
        if (/municipio/i.test(p) || /capitale/i.test(p)) continue;
        if (p === street || p === poi) continue;
        city = p;
        break;
      }

      const region = regionIdx > -1 ? parts[regionIdx] : undefined;
      const postal = postalIdx > -1 ? parts[postalIdx] : undefined;
      const country = countryIdx > -1 ? parts[countryIdx] : undefined;

      const buildResult = (arr: (string | undefined)[]) => {
        const resultParts = arr.filter(Boolean).map((p) => p!.trim());
        if (resultParts.length >= 2) {
          const a = resultParts[0].toLowerCase();
          const b = resultParts[1].toLowerCase();
          if (a === b) {
            resultParts.splice(1, 1);
          }
        }
        return resultParts.join(', ');
      };

      if (street && house) {
        // Via dei Campani, 55, Roma, Lazio, 00185[, Italia]
        return buildResult([street, house, city, region, postal, country]);
      }

      if (poi) {
        // Colosseo, Roma, Lazio, 00184[, Italia]
        return buildResult([poi, city, region, postal, country]);
      }

      return value;
    };

    return (
        <div className="col-span-4 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <div
                    className="
                        text-xl 
                        font-semibold 
                        flex 
                        flex-col 
                        items-center
                        gap-2
                    "
                    >
                    {/* <div className="w-full rounded-2xl p-8 rounded-xl flex items-center gap-3 justify-between items-center"> */}
                    <div className="relative w-full overflow-visible rounded-2xl pt-10 sm:pt-8">
                    {/* Cover area */}
                    <div className="relative h-48 sm:h-50 md:h-58 overflow-hidden rounded-2xl">
                      {/* Background cover */}
                      {coverImage ? (
                        <NextImage
                          src={coverImage}
                          alt={`${user?.username || 'host'} cover`}
                          fill
                          priority={false}
                          className={`object-cover transition-[opacity,filter,transform] duration-500 ease-out
                                      ${coverLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-80 blur-sm scale-[1.02]'}`}
                          onLoadingComplete={() => setCoverLoaded(true)}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-neutral-200" />
                      )}

                      {/* Soft gradient for legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

                      {/* Centered text content */}
                      <div className="mt-6 md:mt-10 absolute inset-0 z-10 flex flex-col pt-2 md:pt-0 items-center justify-center gap-1 px-4 text-center mt-0">
                        {/* Host name */}
                        <button
                          type="button"
                          onClick={handleHostNavigate}
                          className="rounded-full bg-white/90 px-4 py-1 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                        >
                          {user?.username || 'Host'}
                        </button>

                        {/* Rating */}
                        {averageRating !== null && (
                    <div
                      onClick={scrollToReviews}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          scrollToReviews();
                        }
                      }}
                      aria-label="Scroll to reviews"
                      className="flex flex-col items-center cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <defs>
                            <linearGradient id="starGradientHostHeaderTop">
                              <stop offset={`${(averageRating / 5) * 100}%`} stopColor="white" />
                              <stop offset={`${(averageRating / 5) * 100}%`} stopColor="rgba(255,255,255,0.35)" />
                            </linearGradient>
                          </defs>
                          <path
                            fill="url(#starGradientHostHeaderTop)"
                            d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
                              14.81 8.63 12 2 9.19 8.63 2 9.24 
                              7.46 13.97 5.82 21 12 17.27z"
                          />
                        </svg>
                        <span className="text-base sm:text-lg font-normal text-white drop-shadow underline decoration-transparent hover:decoration-white/80">
                          {averageRating.toFixed(1)} / 5
                        </span>
                      </div>

                      <span className="text-[11px] font-medium text-white/85 drop-shadow-sm tracking-wide">
                        (
                        <span className="text-sm font-semibold">
                          {reviewCount}
                        </span>
                        ){" "}
                        TOTAL REVIEW{reviewCount !== 1 ? "S" : ""}
                      </span>
                    </div>
                        )}

                      </div>
                    </div>

                    {/* Avatar floating on top (half in, half out of the cover) */}
                    <button
                      type="button"
                      onClick={handleHostNavigate}
                      title={user?.username || 'Host'}
                      className="absolute left-1/2 -top-2 -translate-x-1/2 z-20 rounded-full outline-none focus:ring-2 focus:ring-black/30"
                    >
                      <div className="rounded-full ring-4 ring-white shadow-xl">
                        <Avatar
                          src={user?.image}
                          name={user?.username}
                          size={96} // adjust as needed
                        />
                      </div>
                    </button>
                  </div>
                        
                  <div className="mt-4 pb-4 md:pb-0 flex w-full flex-row flex-nowrap justify-center items-center gap-2 overflow-x-auto scroll-smooth md:flex-wrap md:overflow-visible md:gap-3">
                  {/* Followers */}
                  <div className="inline-flex shrink-0 min-w-[100px] flex-col rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-black/90 shadow-md backdrop-blur-md">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm" />
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/70">
                        Followers
                      </p>
                    </div>
                    <p className="mt-0.5 text-lg font-semibold leading-tight">
                      {hostFollowersCount}
                    </p>
                  </div>

                  {/* Bookings */}
                  <div className="inline-flex shrink-0 min-w-[100px] flex-col rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-black/90 shadow-md backdrop-blur-md">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-sky-400 shadow-sm" />
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/70">
                        Bookings
                      </p>
                    </div>
                    <p className="mt-0.5 text-lg font-semibold leading-tight">
                      {hostAllTimeBookingCount}
                    </p>
                  </div>

                  {/* Likes */}
                  <div className="inline-flex shrink-0 min-w-[115px] flex-col rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-black/90 shadow-md backdrop-blur-md">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-sm" />
                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/70">
                        Likes
                      </p>
                    </div>
                    <p className="mt-0.5 text-lg font-semibold leading-tight">
                      {listingLikesCount}
                    </p>
                  </div>
                </div>

                        {hostDescription && (
                            <div>
                             <div className="ml-4 mt-5">
                                <Heading title="Overview"/>
                            </div>
                        <p className="px-5 py-5 text-sm text-neutral-600 mt-0 text-justify whitespace-pre-line">
                            {hostDescription}
                        </p>
                        </div>
                        )}
                    </div>
                {/* <div className="
            flex 
            flex-row 
            items-center 
            justify-center
            gap-4 
            font-light
            text-neutral-500

          "
                > */}
            <div className="pt-5 pb-1">
                <hr className="mb-3"/>
                </div>
                <div className="p-5 flex flex-col gap-4 text-left pt-5">
                {/* Guest Count */}
                <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 aspect-square shadow-md rounded-2xl flex items-center justify-center">
                        <RiUserHeartFill size={20} className="text-neutral-600 mt-1" />
                    </div>

                    <div>
                    <p className="text-lg font-medium text-black">
                        Up to {guestCount} guest{guestCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-neutral-600">
                        <span className="underline">{user.username}</span> can welcome a group of up to {guestCount} {guestCount === 1 ? 'guest' : 'guests'}.
                    </p>
                    </div>
                </div>

                {/* Languages */}
                {Array.isArray(languages) && languages.length > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 aspect-square shadow-md rounded-2xl flex items-center justify-center">
                        <BsTranslate size={20} className="text-neutral-600 mt-1" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-black">
                        {languages.join(', ')}
                        </p>
                        <p className="text-sm text-neutral-600">
                         Offers these languages to make your experience comfortable.
                        </p>
                    </div>
                    </div>
                )}

                {/* Experience Duration */}
                {experienceHour && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 aspect-square shadow-md rounded-2xl flex items-center justify-center">
                        <GiExtraTime size={20} className="text-neutral-600 mt-1" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-black">
                        {experienceHour} hour{experienceHour > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-neutral-600">
                        Approximate duration of the full experience from start to finish.
                        </p>
                    </div>
                    </div>
                )}

                {typeof hoursInAdvance === 'number' && hoursInAdvance > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 aspect-square shadow-md rounded-2xl flex items-center justify-center">
                      <GiExtraTime size={20} className="text-neutral-600 mt-1" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-black">
                        {hoursInAdvance} hour{hoursInAdvance === 1 ? '' : 's'} notice required
                      </p>
                      <p className="text-sm text-neutral-600">
                        Guests must book this experience at least that many hours before start time.
                      </p>
                    </div>
                  </div>
                )}
                </div>  

                {/* </div> */}
            </div>

            <hr />
            
            {(Array.isArray(locationType) && locationType.length > 0 || locationDescription ||
              (Array.isArray(groupStyles) && groupStyles.length > 0) ||
              durationCategory ||
              (Array.isArray(environments) && environments.length > 0) ||
              (Array.isArray(activityForms) && activityForms.length > 0) ||
              (Array.isArray(seoKeywords) && seoKeywords.length > 0)
            ) && (
            <div className="p-5 md:col-span-7 rounded-2xl">
                <h2 className="text-lg font-semibold mb-2">Moodboard</h2>

                {Array.isArray(locationType) && locationType.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 text-sm font-semibold text-neutral-700 mb-3">
                    {locationType.map((type) => (
                    <span key={type} className="bg-neutral-100 px-3 py-1.5 rounded-full uppercase tracking-wide text-[11px] text-neutral-700">
                        {formatToken(type)}
                    </span>
                    ))}
                </div>
                )}

                {locationDescription && (
                <LocationDescription text={locationDescription} />
                )}

                {/* {(Array.isArray(groupStyles) && groupStyles.length > 0) || durationCategory ||
                  (Array.isArray(environments) && environments.length > 0) ||
                  (Array.isArray(activityForms) && activityForms.length > 0) ||
                  (Array.isArray(seoKeywords) && seoKeywords.length > 0)
                ? (
                  <div className="mt-5 space-y-4">
                    {Array.isArray(groupStyles) && groupStyles.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Group style</p>
                        <div className="flex flex-wrap gap-2">
                          {groupStyles.map((style) => (
                            <span key={style} className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                              {formatToken(style)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {durationCategory && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Duration</p>
                        <span className="inline-flex rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                          {formatToken(durationCategory)}
                        </span>
                      </div>
                    )}

                    {Array.isArray(environments) && environments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Environment</p>
                        <div className="flex flex-wrap gap-2">
                          {environments.map((environment) => (
                            <span key={environment} className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                              {formatToken(environment)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(activityForms) && activityForms.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Activity form</p>
                        <div className="flex flex-wrap gap-2">
                          {activityForms.map((activity) => (
                            <span key={activity} className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                              {formatToken(activity)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(seoKeywords) && seoKeywords.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {seoKeywords.map((keyword) => (
                            <span key={keyword} className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                              {formatToken(keyword)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null} */}
            </div>
            )}
            
            {/* <hr /> */}

            {category && (
                <ListingCategory
                    icon={category.icon}
                    imageSrc={user?.image}
                    label={category?.label}
                    description={category?.description}
                />
            )}

            <hr className="mb-5 mt-2"/>

            <div className="ml-0">
                <div className="ml-4">
                    <Heading title="About experience" />
                </div>
                <div className="mr-2 px-4 py-5 text-md md:p-5 text-neutral-600 text-justify whitespace-pre-line">
                {description}
                </div>
            </div>

            {/* Experience meta (restyled, single-column with soft shadow) */}
              {(
                (Array.isArray(groupStyles) && groupStyles.length > 0) ||
                durationCategory ||
                (Array.isArray(environments) && environments.length > 0) ||
                (Array.isArray(activityForms) && activityForms.length > 0) ||
                (Array.isArray(seoKeywords) && seoKeywords.length > 0)
              ) && (
                <section className="p-2 mt-6">
                  <div className="rounded-2xl bg-white p-2 space-y-5">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 w-fit border-b">
                      Experience details
                    </h3>

                    {/* Group style */}
                    {Array.isArray(groupStyles) && groupStyles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Group style
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {groupStyles.map((style) => (
                            <span
                              key={style}
                              className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm"
                            >
                              {formatToken(style)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    {durationCategory && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Duration
                        </p>
                        <span className="inline-flex rounded-full bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                          {formatToken(durationCategory)}
                        </span>
                      </div>
                    )}

                    {/* Environment */}
                    {Array.isArray(environments) && environments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Environment
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {environments.map((env) => (
                            <span
                              key={env}
                              className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm"
                            >
                              {formatToken(env)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity form */}
                    {Array.isArray(activityForms) && activityForms.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Activity form
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {activityForms.map((act) => (
                            <span
                              key={act}
                              className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm"
                            >
                              {formatToken(act)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keywords */}
                    {Array.isArray(seoKeywords) && seoKeywords.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Keywords
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {seoKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm"
                            >
                              {formatToken(kw)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            
            <hr className="mb-2"/>

        <div className="flex flex-col gap-1">
            <div className="ml-4">
                <Heading title="Location" />
                </div>

            <div className="ml-4 flex flex-row gap-3 items-center rounded-full px-2 text-black-500">
                
                <div className="mt-2 relative">
                    <span className="absolute inline-flex h-4 w-4 rounded-full bg-neutral-300 opacity-75 animate-ping"></span>
                    <span className="relative mb-1 inline-flex rounded-full h-4 w-4 bg-neutral-100 shadow-md"></span>
                </div>

                {meetingPoint && (
                  <p className="text-sm font-semibold rounded-full bg-neutral-100 inline p-3 text-neutral-800 ">
                    {formatItalianLocation(meetingPoint)}
                  </p>
                )}
            </div>
        </div>

            {/* <Map key={coordinates?.join(',') || 'default'} center={coordinates} /> */}
            <div className="p-2 md:p-0 md:px-4">
            <MapListing searchQuery={meetingPoint}/>
            </div>

        </div>
    );
}

export default ListingInfo;