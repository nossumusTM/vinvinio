'use client';

import { useMemo } from "react";
import Slider from "react-slick";
import type { CustomArrowProps } from "react-slick";
import type { MouseEventHandler } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ListingCard from "@/app/(marketplace)/components/listings/ListingCard";
import useGeoLocationExperiment from "@/app/(marketplace)/hooks/useGeoLocationExperiment";
import useCountries from "@/app/(marketplace)/hooks/useCountries";

const ArrowButton = ({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={direction === "left" ? "Previous listings" : "Next listings"}
    className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 text-neutral-800 shadow-[0_10px_25px_rgba(15,23,42,0.25)] transition hover:scale-[1.03] hover:shadow-[0_14px_28px_rgba(15,23,42,0.30)]"
  >
    {direction === "left" ? (
      <FiChevronLeft className="h-5 w-5" />
    ) : (
      <FiChevronRight className="h-5 w-5" />
    )}
  </button>
);

const PrevArrow = ({ onClick }: CustomArrowProps) => (
  <div className="absolute left-2 top-1/2 z-20 -translate-y-1/2 md:left-4">
    <ArrowButton direction="left" onClick={onClick} />
  </div>
);

const NextArrow = ({ onClick }: CustomArrowProps) => (
  <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2 md:right-4">
    <ArrowButton direction="right" onClick={onClick} />
  </div>
);

const sliderSettings = {
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 3500,
  pauseOnHover: true,
  slidesToShow: 3,
  slidesToScroll: 1,
  arrows: true,
  dots: true,
  swipeToSlide: true,
  touchMove: true,
  nextArrow: <NextArrow />,
  prevArrow: <PrevArrow />,
  responsive: [
    {
      breakpoint: 1536,
      settings: {
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 1,
      },
    },
  ],
};

const ListingSlider = ({
  listings,
  currentUser,
}: {
  listings: any[];
  currentUser: any;
}) => {
  const detection = useGeoLocationExperiment((state) => state.detection);
  const { getByValue } = useCountries();

  const userCountryCode = detection?.countryCode?.toUpperCase() ?? null;
  const userCountryName = detection?.country?.trim().toLowerCase() ?? null;

  const localListings = useMemo(() => {
    if (!userCountryCode && !userCountryName) return [];

    return listings.filter((listing) => {
      const locationValue = listing?.locationValue;
      if (typeof locationValue !== "string" || !locationValue.trim()) return false;

      const direct = getByValue(locationValue);
      const resolvedValue = direct?.value ?? locationValue;
      const countryCode = resolvedValue.split("-").pop()?.toUpperCase();
      const countryName = direct?.label?.trim().toLowerCase();

      if (userCountryCode && countryCode === userCountryCode) return true;
      if (userCountryName && countryName === userCountryName) return true;

      return false;
    });
  }, [getByValue, listings, userCountryCode, userCountryName]);

  if (!localListings.length) {
    return null;
  }

  const canSlide = localListings.length > 1;
  const mergedSettings = {
    ...sliderSettings,
    infinite: canSlide,
    autoplay: canSlide,
    arrows: canSlide,
    dots: canSlide,
  };

  return (
    <div className="w-full px-4 md:px-16 h-fit overflow-hidden">
      <Slider {...mergedSettings}>
        {localListings.map((listing) => (
          <div key={listing.id} className="px-3 md:px-4 h-fit md:h-full pb-2 md:pb-4">
            <ListingCard data={listing} currentUser={currentUser} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ListingSlider;
