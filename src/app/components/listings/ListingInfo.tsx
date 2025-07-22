'use client';

import dynamic from "next/dynamic";
import { IconType } from "react-icons";
import Heading from "../Heading";

import { TbUserCheck, TbClockPlay, TbLanguage, TbPointerPin } from "react-icons/tb";
import { PiHandPointing } from "react-icons/pi";
import { FaPeopleGroup } from "react-icons/fa6";
import { BsTranslate } from "react-icons/bs";
import { GrCycle } from "react-icons/gr";
import { FaRegFaceSmileBeam } from "react-icons/fa6";
import { FaPiedPiperHat } from "react-icons/fa";
import { GiPointyHat } from "react-icons/gi";
import { GiRobinHoodHat } from "react-icons/gi";
import { RiUserHeartFill } from "react-icons/ri";
import { GiExtraTime } from "react-icons/gi";
import LocationDescription from '../LocationDescription';

import { useEffect, useState } from "react";
import Button from "../Button";

import useCountries from "@/app/hooks/useCountries";
import { SafeUser } from "@/app/types";

import Avatar from "../Avatar";
import ListingCategory from "./ListingCategory";

const Map = dynamic(() => import('../Map'), {
    ssr: false
});

interface ListingInfoProps {
    user: SafeUser,
    description: string;
    guestCount: number;
    category: {
        icon: IconType,
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
    locationDescription
}) => {
    const { getByValue } = useCountries();

    const coordinates = getByValue(locationValue)?.latlng

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
                    <div className="flex items-center gap-2 pt-2">
                    <Avatar src={user?.image} name={user?.name} size={55}/>
                    <div className="flex text-sm flex-row justify-start gap-2 font-normal">Guided by 
                        <div className="font-semibold border-b border-neutral-500">
                        {user?.name}
                        </div>
                    </div>
                    </div>

                    {averageRating !== null && (
                        <div className="flex items-center gap-2 mb-4 pt-4">
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
                        
                        {hostDescription && (
                        <p className="px-5 py-5 text-sm text-neutral-600 mt-2 text-justify whitespace-pre-line">
                            {hostDescription}
                        </p>
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
                <div className="flex flex-row gap-3 items-start">
                    <RiUserHeartFill className="text-neutral-600 mt-1 w-8 h-8 md:w-[30px] md:h-[30px]" />
                    <div>
                    <p className="text-lg font-medium text-black">
                        Up to {guestCount} guest{guestCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-neutral-600">
                        {hostName} can welcome a group of up to {guestCount} {guestCount === 1 ? 'traveller' : 'travellers'}.
                    </p>
                    </div>
                </div>

                {/* Languages */}
                {Array.isArray(languages) && languages.length > 0 && (
                    <div className="flex flex-row gap-3 items-start">
                    <BsTranslate size={30} className="text-neutral-600 mt-1" />
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
                    <div className="flex flex-row gap-3 items-start">
                    <GiExtraTime size={30} className="text-neutral-600 mt-1" />
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
            
            {(Array.isArray(locationType) && locationType.length > 0 || locationDescription) && (
            <div className="p-5 md:col-span-7 rounded-2xl">
                <h2 className="text-lg font-semibold mb-2">Experience theme</h2>

                {Array.isArray(locationType) && locationType.length > 0 && (
                <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-700 mb-2">
                    <strong className="mr-1">Type:</strong>
                    {locationType.map((type, i) => (
                    <span key={i} className="bg-neutral-100 px-2 py-1 rounded-full capitalize">
                        {type.replace(/_/g, ' ')}
                    </span>
                    ))}
                </div>
                )}

                {locationDescription && (
                <LocationDescription text={locationDescription} />
                )}
            </div>
            )}
            
            {/* <hr /> */}

            {category && (
                <ListingCategory
                    icon={category.icon}
                    label={category?.label}
                    description={category?.description}
                />
            )}
            <hr className="mb-5"/>

            <div className="ml-4">
                <Heading title="About experience" />
                <div className="mr-2 px-4 py-5 text-md md:p-5 text-neutral-600 text-justify whitespace-pre-line">
                {description}
                </div>
            </div>
            
            <hr className="mb-2"/>

            <div className="flex flex-row gap-0 items-center">

            <div className="pt-2 ml-5">
                <PiHandPointing size={24}/>
            </div>

                {meetingPoint && (
                <p className="text-lg text-neutral-600 mt-2 ml-1 text-center">
                    Meeting Point: <strong>{meetingPoint}</strong>
                </p>
                )}
            </div>

            {/* <Map key={coordinates?.join(',') || 'default'} center={coordinates} /> */}
            <div className="p-2 md:p-0 md:px-4">
            <Map searchQuery={meetingPoint}/>
            </div>

        </div>
    );
}

export default ListingInfo;