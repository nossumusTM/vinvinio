'use client';

import Image from 'next/image';
import { useState, useMemo, useEffect, useCallback } from 'react';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import { PiShareFat } from "react-icons/pi";
import { SafeUser } from '@/app/(marketplace)/types';
import Heading from '../Heading';
import HeartButton from '../HeartButton';
import Lightbox from 'yet-another-react-lightbox';
import { AnimatePresence, motion } from 'framer-motion';
import 'yet-another-react-lightbox/styles.css';
import { TbShare2 } from 'react-icons/tb';
import ConfirmPopup from '../ConfirmPopup';
import { CountrySelectValue } from '../inputs/CountrySelect';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';

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
  const router = useRouter();
  // const location = getByValue(locationValue);
  const location = getByValue(locationValue) as CountrySelectValue | undefined;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [hasInteractedGallery, setHasInteractedGallery] = useState(false);

  const { primaryImage, firstGridImages, extraImageGroups } = useMemo(() => {
    if (!imageGallery.length) {
      return {
        primaryImage: undefined as string | undefined,
        firstGridImages: [] as string[],
        extraImageGroups: [] as string[][],
      };
    }

  const primary = imageGallery[0];
  const secondary = imageGallery.slice(1);
  const firstGrid = secondary.slice(0, 4);
  const remaining = secondary.slice(4);

  const groups: string[][] = [];
    for (let i = 0; i < remaining.length; i += 4) {
      groups.push(remaining.slice(i, i + 4));
    }

    return {
      primaryImage: primary,
      firstGridImages: firstGrid,
      extraImageGroups: groups,
    };
  }, [imageGallery]);

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

  const hasSingleImage = !videoSrc && imageGallery.length === 1;

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

  const simplifiedLocation = useMemo(() => {
    if (!locationValue) return 'Unknown location';
    const parts = locationValue.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 4) {
      const [streetNumber, streetName, neighborhood, city] = parts;
      return `${streetName || streetNumber}${streetNumber ? `, ${streetNumber}` : ''} ${neighborhood || ''} ${city || ''}`.trim();
    }
    return locationValue;
  }, [locationValue]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleScrollToReviews = useCallback(() => {
    const el = document.getElementById('reviews');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <>
    <div className='flex flex-col md:pt-8 px-4'>
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          onClick={handleBack}
          className="mb-2 inline-flex items-center gap-2 rounded-full bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:-translate-x-0.5 hover:bg-neutral-100"
        >
          <LuArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Heading title={title} subtitle={''} />
      </div>
      <div className='flex flex-row gap-2 items-center'>

      {reviews.length > 0 && (
       <div className="md:col-span-7">
          {/* Overall Rating */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleScrollToReviews}>
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

      <p className='font-semibold text-sm mt-1 bg-neutral-100 rounded-full px-2 py-1'>
      <span>
          {location
            ? 'city' in location
              ? `${location.city}, ${location.label}`
              : location.label ?? simplifiedLocation
            : simplifiedLocation}
        </span>
        </p>
      </div>
      </div>

     {/* 🔹 Horizontally scrollable media strip (hero height) */}
            <div className="w-full rounded-xl relative mt-4">
        {/* Top-right actions */}
        <div className="absolute top-3 right-4 z-20 flex items-center gap-1 pointer-events-auto">
  <HeartButton listingId={id} currentUser={currentUser} inline />

  <button
    onClick={() => {
      navigator.clipboard.writeText(window.location.href);
      setShowSharePopup(true);
      setTimeout(() => setShowSharePopup(false), 2500);
    }}
    aria-label="Share"
    className="
      mt-2
      p-2 rounded-full
      border border-white/30 hover:border-white
      bg-white/10 backdrop-blur-sm
      text-white
      transition
      flex items-center justify-center
    "
  >
    <PiShareFat size={18} />
  </button>
</div>


        {/* 🎥 Pure video cover case */}
        {videoSrc && imageGallery.length === 0 && (
          <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden">
            <video
              src={videoSrc}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        )}

        {/* 🖼 Single image → full cover */}
        {!videoSrc && hasSingleImage && imageGallery[0] && (
          <div
            className="relative w-full h-[70vh] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => handleMediaClick(imageGallery[0])}
          >
            <Image
              src={imageGallery[0]}
              alt="Cover image"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="p-8 w-10 h-10 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm rounded-full bg-black/40">
                TAP
              </span>
            </div>
          </div>
        )}

        {/* 🎥 Video + images OR multiple images → horizontal scroller */}
        {(!hasSingleImage || videoSrc) && (
          <div
            className="
              relative
              flex
              w-full
              h-[70vh]
              overflow-x-auto overflow-y-hidden
              rounded-2xl
              scroll-smooth
              snap-x snap-mandatory
              touch-pan-x
              cursor-grab active:cursor-grabbing
              scrollbar-thin
            "
          >
            {(() => {
              const primaryImage = imageGallery[0];
              const secondaryImages = imageGallery.slice(1);

              // slice secondary images into chunks of 4 for 2x2 grids
              const gridSlides: string[][] = [];
              for (let i = 0; i < secondaryImages.length; i += 4) {
                gridSlides.push(secondaryImages.slice(i, i + 4));
              }

              return (
                <>
                  {/* First slide: video or cover + 2x2 grid */}
                  <div className="flex min-w-full snap-start gap-2">
                    <div className="relative flex-1 h-full group">
                      {videoSrc ? (
                        <video
                          src={videoSrc}
                          className="w-full h-full object-cover rounded-2xl"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        primaryImage && (
                          <div
                            className="relative w-full h-full cursor-pointer"
                            onClick={() => handleMediaClick(primaryImage)}
                          >
                            <Image
                              src={primaryImage}
                              alt="Main cover"
                              fill
                              className="object-cover rounded-2xl"
                              sizes="(max-width: 768px) 100vw, 60vw"
                              priority
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="p-8 w-10 h-10 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm rounded-full bg-black/40">
                                TAP
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Right 2x2 grid for first 4 secondary images */}
                    {gridSlides[0] && (
                      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2 h-full">
                        {gridSlides[0].map((src, index) => (
                          <div
                            key={src + index}
                            className="relative w-full h-full cursor-pointer group"
                            onClick={() => handleMediaClick(src)}
                          >
                            <Image
                              src={src}
                              alt={`gallery-${index}`}
                              fill
                              className="object-cover rounded-xl"
                              sizes="(max-width: 768px) 100vw, 40vw"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="p-8 w-10 h-10 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm rounded-full bg-black/40">
                                TAP
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Extra slides: handle last single image as full-cover */}
                  {gridSlides.slice(1).map((slideImages, slideIndex) => {
                    const isSingle = slideImages.length === 1;
                    const slideKey = `slide-${slideIndex}`;

                    if (isSingle) {
                      const src = slideImages[0];
                      return (
                        <div
                          key={slideKey}
                          className="min-w-full snap-start h-full flex px-2"
                        >
                          <div
                            className="relative w-full h-full cursor-pointer group rounded-2xl overflow-hidden"
                            onClick={() => handleMediaClick(src)}
                          >
                            <Image
                              src={src}
                              alt={`gallery-extra-full-${slideIndex}`}
                              fill
                              className="object-cover"
                              sizes="100vw"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="p-8 w-10 h-10 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm rounded-full bg-black/40">
                                TAP
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Default: 2x2 grid for 2–4 images
                    return (
                      <div
                        key={slideKey}
                        className="min-w-full snap-start grid grid-cols-2 grid-rows-2 gap-2 h-full"
                      >
                        {slideImages.map((src, index) => (
                          <div
                            key={src + index}
                            className="relative w-full h-full cursor-pointer group"
                                    onClick={() => handleMediaClick(src)}
                                  >
                                    <Image
                                      src={src}
                                      alt={`gallery-extra-${slideIndex}-${index}`}
                                      fill
                                      className="object-cover rounded-xl"
                                      sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 transition-opacity group-hover:opacity-100">
                                      <span className="p-8 w-10 h-10 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm rounded-full bg-black/40">
                                        TAP
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}

                </>
              );
            })()}
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
