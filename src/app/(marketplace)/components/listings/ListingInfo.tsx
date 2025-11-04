'use client';

import dynamic from "next/dynamic";
import { IconType } from "react-icons";
import Heading from "../Heading";

import { BsTranslate } from "react-icons/bs";
import { RiUserHeartFill } from "react-icons/ri";
import { GiExtraTime } from "react-icons/gi";
import LocationDescription from '../LocationDescription';

import { useEffect, useState, useCallback } from "react";
import Button from "../Button";

import useCountries from "@/app/(marketplace)/hooks/useCountries";
import { SafeUser } from "@/app/(marketplace)/types";

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
        // icon: IconType,
        imageSrc: string | null | undefined;
        label: string;
        description: string;
    } | undefined
    locationValue: string;
    imageSrc: string[]; // ✅ Add this
    experienceHour?: number;
    hostName?: string;
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
    languages,
    meetingPoint,
    locationType,
    locationDescription,
    groupStyles,
    durationCategory,
    environments,
    activityForms,
    seoKeywords,
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
        if (!user?.id) {
            return;
        }
        router.push(`/hosts/${user.id}`);
    }, [router, user?.id]);

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
                    <div className="w-full rounded-2xl p-8 rounded-xl flex items-center gap-3 justify-center items-center">
                    <Avatar src={user?.image} name={user?.name} size={65}/>
                    <div className="mt-2 flex text-sm flex-col justify-start font-normal items-center">
                        <button
                            type="button"
                            onClick={handleHostNavigate}
                            className="px-3 py-1 rounded-full font-semibold bg-neutral-100 hover:bg-neutral-200 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
                        >
                        {user?.name || 'Host'}
                        </button>

                    {averageRating !== null && (
                        <div className="flex items-center gap-2 justify-center">
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
                            <span className="text-lg text-neutral-700 font-medium">
                            {averageRating.toFixed(1)} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                        )}
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
                      <div className="w-12 h-12 shrink-0 aspect-square bg-neutral-100 rounded-full flex items-center justify-center">
                        <RiUserHeartFill size={20} className="text-neutral-600 mt-1" />
                    </div>

                    <div>
                    <p className="text-lg font-medium text-black">
                        Up to {guestCount} guest{guestCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-neutral-600">
                        {hostName} can welcome a group of up to {guestCount} {guestCount === 1 ? 'guest' : 'guests'}.
                    </p>
                    </div>
                </div>

                {/* Languages */}
                {Array.isArray(languages) && languages.length > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 aspect-square bg-neutral-100 rounded-full flex items-center justify-center">
                        <BsTranslate size={20} className="text-neutral-600 mt-1" />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-black">
                        {languages.join(', ')}
                        </p>
                        <p className="text-sm text-neutral-600">
                        {hostName} offers these languages to make your experience comfortable.
                        </p>
                    </div>
                    </div>
                )}

                {/* Experience Duration */}
                {experienceHour && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0 aspect-square bg-neutral-100 rounded-full flex items-center justify-center">
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
                <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-700 mb-3">
                    {locationType.map((type) => (
                    <span key={type} className="bg-neutral-100 px-2 py-1 rounded-full uppercase tracking-wide text-[11px] text-neutral-700">
                        {formatToken(type)}
                    </span>
                    ))}
                </div>
                )}

                {locationDescription && (
                <LocationDescription text={locationDescription} />
                )}

                {(Array.isArray(groupStyles) && groupStyles.length > 0) || durationCategory ||
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
                ) : null}
            </div>
            )}
            
            {/* <hr /> */}

            {category && (
                <ListingCategory
                    // icon={category.icon}
                    imageSrc={user?.image}
                    label={category?.label}
                    description={category?.description}
                />
            )}
            <hr className="mb-5"/>

            <div className="ml-0">
                <div className="ml-4">
                    <Heading title="About experience" />
                </div>
                <div className="mr-2 px-4 py-5 text-md md:p-5 text-neutral-600 text-justify whitespace-pre-line">
                {description}
                </div>
            </div>
            
            <hr className="mb-2"/>

        <div className="flex flex-col gap-1">
            <div className="ml-4">
                <Heading title="Activity starts" />
                </div>

            <div className="ml-4 flex flex-row gap-3 items-center rounded-full px-2 text-black-500">
                
                <div className="mt-2 relative">
                    <span className="absolute inline-flex h-4 w-4 rounded-full bg-neutral-300 opacity-75 animate-ping"></span>
                    <span className="relative mb-1 inline-flex rounded-full h-4 w-4 bg-neutral-100 shadow-md"></span>
                </div>

                {meetingPoint && (
                <p className="text-sm font-semibold rounded-full bg-neutral-100 inline p-3 text-neutral-800 ">
                    {meetingPoint}
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