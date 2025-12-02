'use client';

import Slider from "react-slick";
import ListingCard from "@/app/(marketplace)/components/listings/ListingCard";

// 🔧 aggiorna la config
const sliderSettings = {
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 3000,
  slidesToShow: 2,          // base: mobile
  slidesToScroll: 1,
  arrows: false,
  dots: true,
  swipeToSlide: true,
  touchMove: true,
  mobileFirst: true,        // 🔥 importante per i breakpoint
  responsive: [
    {
      breakpoint: 768,      // ≥ 768px (tablet/desktop)
      settings: {
        slidesToShow: 1,
      },
    },
    {
      breakpoint: 9999,      // ≥ 768px (tablet/desktop)
      settings: {
        slidesToShow: 3,
      },
    },
  ],
};

// 🔧 piccolo aggiustamento al wrapper per evitare layout strani su desktop
const ListingSlider = ({
  listings,
  currentUser,
}: {
  listings: any[];
  currentUser: any;
}) => {
  return (
    <div className="w-full px-4 md:px-20 h-fit overflow-hidden">
      <Slider {...sliderSettings}>
        {listings.map((listing) => (
          <div key={listing.id} className="px-2 md:px-4 h-screen">
            <ListingCard data={listing} currentUser={currentUser} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ListingSlider;