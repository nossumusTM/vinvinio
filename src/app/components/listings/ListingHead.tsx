'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import useCountries from '@/app/hooks/useCountries';
import { PiShareFat } from "react-icons/pi";
import { SafeUser } from '@/app/types';
import Heading from '../Heading';
import HeartButton from '../HeartButton';
import Lightbox from 'yet-another-react-lightbox';
import { AnimatePresence, motion } from 'framer-motion';
import 'yet-another-react-lightbox/styles.css';
import { TbShare2 } from 'react-icons/tb';
import ConfirmPopup from '../ConfirmPopup';
import { CountrySelectValue } from '../inputs/CountrySelect';

interface ListingHeadProps {
  title: string;
  locationValue: string;
  imageSrc: string[];
  id: string;
  currentUser?: SafeUser | null;
}

const ListingHead: React.FC<ListingHeadProps> = ({
  title,
  locationValue,
  imageSrc,
  id,
  currentUser,
}) => {
  const { getByValue } = useCountries();
  // const location = getByValue(locationValue);
  const location = getByValue(locationValue) as CountrySelectValue | undefined;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const [reviews, setReviews] = useState<{ 
      rating: number; 
      comment: string; 
      userName: string;
      userImage?: string;
      createdAt: string;
  }[]>([]);

  // Video and image separation
  const videoSrc = imageSrc.find(
    (src) => src.endsWith('.mp4') || src.includes('/video/')
  );

  const handleMediaClick = (src: string) => {
    if (!imageGallery.length) return;
    const index = imageGallery.findIndex((s) => s === src);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  const lightboxSlides = useMemo(() => {
    return imageGallery.map((src) => ({
      src,
      type: "image" as const,
    }));
  }, [imageGallery]);  

  useEffect(() => {
    if (imageGallery.length === 0 && imageSrc.length > 0) {
      const images = imageSrc.filter(
        (src) => !src.endsWith('.mp4') && !src.includes('/video/')
      );
      setImageGallery(images); // ← no shuffling or reruns
    }
  }, [imageSrc, imageGallery.length]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews/get-by-listing', {
          method: 'POST',
          body: JSON.stringify({ listingId: id }),
        });
        const data = await res.json();
        setReviews(data || []);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };
  
    fetchReviews();
  }, [id]);

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

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);   

  return (
    <>
    <div className='flex flex-col md:pt-8 px-4'>
      <Heading title={title} subtitle={''} />
      <div className='flex flex-row gap-2 items-center'>

      {reviews.length > 0 && (
       <div className="md:col-span-7">
          {/* Overall Rating */}
          <div className="flex items-center gap-2">
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
              <span className="text-lg text-neutral-700 font-normal">
                  {averageRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
               </span>
          </div>
          </div>
      )}

      <p className='font-semibold text-xs mt-1 bg-neutral-100 rounded-full px-2 py-1'>
      <span>
          {location
            ? 'city' in location
              ? `${location.city}, ${location.label}`
              : location.label
            : 'Unknown location'}
        </span>
        </p>
      </div>
      </div>

      <div className="w-full rounded-xl relative mt-4">
        <div className="absolute top-5 right-5 z-10 flex gap-4 items-center">

        <div className='absolute top-0 left-2'>
        <HeartButton listingId={id} currentUser={currentUser} />
        </div>

        <div className='absolute top-1 right-10'>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setShowSharePopup(true);
            setTimeout(() => setShowSharePopup(false), 2500);
          }}
          aria-label="Share"
          className="
            p-2 rounded-full
            border border-white/30 hover:border-white
            bg-white/10 backdrop-blur-sm
            text-white
            transition
          "
        >
          <PiShareFat size={18} />
        </button>
        </div>

        </div>

        {imageSrc.length === 1 && videoSrc ? (
          <div className="relative w-full h-[80vh] rounded-xl overflow-hidden">
            {/* Blurred background video */}
            <video
              src={videoSrc}
              className="rounded-xl absolute top-0 left-0 w-full h-full object-cover filter blur-xl scale-110"
              autoPlay
              muted
              loop
              playsInline
            />  
            <div className="absolute inset-0 bg-white/30 z-10" />

            {/* Foreground video */}
            <div className="p-10 relative z-20 flex justify-center items-center h-full">
              <video
                src={videoSrc}
                className="rounded-xl h-full w-auto max-w-full object-contain"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          </div>
        ) : (
        // 🖼️ Standard media grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full rounded-xl overflow-hidden h-[60vh]">
          {/* Left: Video or first image */}
          <div className="relative w-full h-full">
            {videoSrc ? (
              <video
                src={videoSrc}
                className="w-full h-full object-cover rounded-xl"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              imageGallery[0] && (
                <div
                  className="relative w-full h-full"
                  onClick={() => handleMediaClick(imageGallery[0])}
                >
                  <Image
                    src={imageGallery[0]}
                    alt="Main Cover"
                    fill
                    className="object-cover rounded-xl"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )
            )}
          </div>

          {/* Right: Image collage */}
          <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
            {imageGallery.slice(1, 5).map((src, index) => (
              <div
                key={index}
                className="relative w-full h-full cursor-pointer"
                onClick={() => handleMediaClick(src)}
              >
                <Image
                  src={src}
                  alt={`gallery-${index}`}
                  fill
                  className="object-cover rounded-md"
                  priority
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            key="lb-blur"
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 60, // below the lightbox root (we’ll raise the root next)
              pointerEvents: 'none', // clicks go to the lightbox backdrop
            }}
          />
        )}
      </AnimatePresence>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        controller={{ closeOnBackdropClick: true }}   // ✅ THIS LINE
        slides={lightboxSlides}
        toolbar={{ buttons: [] }}
        animation={{ fade: 300, swipe: 450 }}
        styles={{
          container: {
            backgroundColor: 'transparent', // let our overlay handle tint/blur
          },
        }}
        render={{
          iconPrev: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" className="pointer-events-none">
              <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          iconNext: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" className="pointer-events-none">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
          // iconClose: () => (
          //   <svg width="18" height="18" viewBox="0 0 24 24" className="pointer-events-none">
          //     <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="2"
          //           strokeLinecap="round" strokeLinejoin="round" />
          //   </svg>
          // ),
        }}
      />

      <style jsx global>{`
        .yarl__root { z-index: 70 !important; } /* above our overlay (60) */
      `}</style>

      <style jsx global>{`
        /* Glass-pill buttons (Prev / Next / Close) */
        .yarl__iconButton,
        .yarl__root button[aria-label="Previous"],
        .yarl__root button[aria-label="Next"],
        .yarl__root button[aria-label="Close"] {
          border: 1px solid rgba(255, 255, 255, 0.32) !important;
          background: rgba(255, 255, 255, 0.12) !important;
          backdrop-filter: blur(6px);
          border-radius: 9999px !important;
          padding: 8px !important;
          box-shadow: none !important;
          transition: border-color .2s ease, background-color .2s ease;
        }

        /* Remove border/background from icon wrapper entirely */
        .yarl__icon,
        .yarl__toolbarIcon,
        .yarl__iconButton svg,
        .yarl__root button[aria-label="Previous"] svg,
        .yarl__root button[aria-label="Next"] svg,
        .yarl__root button[aria-label="Close"] svg {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          width: 18px !important;
          height: 18px !important;
          stroke: currentColor !important;
          color: #fff !important;
        }

        /* Hover stays clean — no movement, just brighter glass */
        .yarl__iconButton:hover,
        .yarl__root button[aria-label="Previous"]:hover,
        .yarl__root button[aria-label="Next"]:hover,
        .yarl__root button[aria-label="Close"]:hover {
          border-color: #ffffff !important;
          background: rgba(255, 255, 255, 0.22) !important;
        }

        /* Perfect arrow spacing */
        .yarl__root button[aria-label="Previous"] {
          left: 28px !important;
        }
        .yarl__root button[aria-label="Next"] {
          right: 28px !important;
        }

        /* Close button nice positioning */
        .yarl__root button[aria-label="Close"] {
          top: 20px !important;
          right: 20px !important;
        }

        /* No outline flash */
        .yarl__iconButton:focus-visible,
        .yarl__root button[aria-label="Previous"]:focus-visible,
        .yarl__root button[aria-label="Next"]:focus-visible,
        .yarl__root button[aria-label="Close"]:focus-visible {
          outline: none !important;
        }
      `}</style>

      {showSharePopup && (
        <ConfirmPopup
          type="success"
          message="Link copied, you can share it wherever you want"
          onCancel={() => setShowSharePopup(false)}
          hideActions // 👈 hide both buttons
        />
      )}

    </>
  );
};

export default ListingHead;
