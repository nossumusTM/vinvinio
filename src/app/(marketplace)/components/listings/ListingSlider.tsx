'use client';

import Slider from "react-slick";
import ListingCard from "@/app/(marketplace)/components/listings/ListingCard";

const sliderSettings = {
  // dots: true,
  infinite: false,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 3000,
  slidesToScroll: 1,
  // verticalSwiping: true,
  arrows: false,
  responsive: [
    {
      breakpoint: 768, // Mobile
      settings: {
        slidesToShow: 1,
      },
    },
    {
      breakpoint: 9999, // Desktop fallback
      settings: {
        slidesToShow: 2,
      },
    },
  ],
};

const ListingSlider = ({ listings, currentUser }: { listings: any[], currentUser: any }) => {
  return (
    <div className="w-full md:w-screen md:px-20 overflow-hidden">
      <Slider {...sliderSettings}>
        {listings.map((listing) => (
          <div key={listing.id} className="p-4">
            <ListingCard data={listing} currentUser={currentUser} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ListingSlider;