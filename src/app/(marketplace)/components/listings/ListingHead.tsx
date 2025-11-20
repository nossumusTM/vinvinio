'use client';

import React from 'react';
import Image from 'next/image';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import { PiShareFat } from "react-icons/pi";
import { SafeUser } from '@/app/(marketplace)/types';
import Heading from '../Heading';
import HeartButton from '../HeartButton';
import ShareButton from '../ShareButton';
import ListingLikeButton from './ListingLikeButton';
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
  likesCount?: number;
  isLikedByCurrentUser?: boolean;
}

const ListingHead: React.FC<ListingHeadProps> = ({
  title,
  locationValue,
  imageSrc,
  id,
  currentUser,
  likesCount = 0,
  isLikedByCurrentUser = false,
}) => {
  const { getByValue } = useCountries();
  const router = useRouter();
  // const location = getByValue(locationValue);
  const location = getByValue(locationValue) as CountrySelectValue | undefined;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const lastDragDelta = useRef(0);


  const lastClientX = useRef(0);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedOnce = useRef(false);

  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const dragMoved = useRef(false);
  const suppressClick = useRef(false);
  const suppressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasInteractedGallery, setHasInteractedGallery] = useState(false);

    const dragState = useRef({
      pointerId: null as number | null,
      startX: 0,
      scrollStart: 0,
      hasMoved: false,
    });

    const lightboxControllerRef = useRef<any>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return; // only left click
      const scroller = scrollerRef.current;
      if (!scroller) return;

      setIsDragging(true);
      dragMoved.current = false;
      dragStartX.current = e.clientX;
      scrollStartX.current = scroller.scrollLeft;

      if (suppressTimeout.current) {
        clearTimeout(suppressTimeout.current);
        suppressTimeout.current = null;
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const dx = e.clientX - dragStartX.current;

      // small threshold before we treat it as a drag
      if (!dragMoved.current && Math.abs(dx) < 4) return;

      dragMoved.current = true;
      e.preventDefault();
      scroller.scrollLeft = scrollStartX.current - dx;
    };

    const endDrag = () => {
      if (!isDragging) return;

      setIsDragging(false);

      if (dragMoved.current) {
        hasDraggedOnce.current = true;
        suppressClick.current = true;

        // block click for a short moment so drag doesn't trigger lightbox
        suppressTimeout.current = setTimeout(() => {
          suppressClick.current = false;
        }, 150);
      }
    };

    const handleMouseUp = () => {
      endDrag();
    };

    const handleMouseLeave = () => {
      endDrag();
    };


  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollerRef.current || hasDraggedOnce.current) return;

    setIsDragging(true);
    setHasInteractedGallery(true); // hide helper once user interacts

    dragStartX.current = e.clientX;
    scrollStartX.current = scrollerRef.current.scrollLeft;
    lastClientX.current = e.clientX;

    // Avoid image dragging / text selection
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollerRef.current) return;

    e.preventDefault();
    const dx = e.clientX - dragStartX.current;

    // small deadzone to avoid micro-jitter
    if (Math.abs(dx) < 3) return;

    scrollerRef.current.scrollLeft = scrollStartX.current - dx;
    lastClientX.current = e.clientX;
  };

  const handleDragEnd = () => {
    if (!isDragging || !scrollerRef.current) return;

    setIsDragging(false);

    // subtle inertial finish
    const dx = lastClientX.current - dragStartX.current;
    scrollerRef.current.scrollLeft -= dx * 0.2;

    hasDraggedOnce.current = true;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      // Only left mouse / primary pointer
      if (e.button !== 0) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;

      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        scrollStart: scroller.scrollLeft,
        hasMoved: false,
      };

      setIsDragging(false);
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const state = dragState.current;
      if (state.pointerId !== e.pointerId) return;

      const deltaX = e.clientX - state.startX;

      // small threshold to start dragging
      if (!state.hasMoved && Math.abs(deltaX) > 4) {
        state.hasMoved = true;
        setIsDragging(true);
      }

      if (state.hasMoved) {
        e.preventDefault();
        scroller.scrollLeft = state.scrollStart - deltaX;
      }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      const state = dragState.current;
      if (state.pointerId !== e.pointerId) return;

      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);

      if (state.hasMoved) {
        hasDraggedOnce.current = true;
      }

      dragState.current = {
        pointerId: null,
        startX: 0,
        scrollStart: 0,
        hasMoved: false,
      };
      setIsDragging(false);
    };

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

  const [videoOrientation, setVideoOrientation] = useState<'portrait' | 'landscape' | null>(null);

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (!v.videoWidth || !v.videoHeight) return;

    if (v.videoHeight > v.videoWidth) {
      setVideoOrientation('portrait');
    } else {
      setVideoOrientation('landscape');
    }
  };

  const mediaSlides = useMemo(
    () => {
      const slides: { src: string; kind: 'image' | 'video' }[] = [];

      if (videoSrc) {
        slides.push({ src: videoSrc, kind: 'video' });
      }

      imageGallery.forEach((src) => {
        slides.push({ src, kind: 'image' });
      });

      return slides;
    },
    [videoSrc, imageGallery]
  );

  const handleMediaClick = (src: string) => {
    if (!mediaSlides.length) return;
    const index = mediaSlides.findIndex((s) => s.src === src);
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-2">
        <button
          type="button"
          onClick={handleBack}
          className="mb-2 inline-flex items-center gap-2 rounded-full bg-neutral-50 px-3 py-1 text-sm font-medium text-neutral-700 shadow-sm transition hover:-translate-x-0.5 hover:bg-neutral-100"
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
              <span className="text-lg text-neutral-700 font-normal hover:border-b border-neutral-800 transition">
                  {averageRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
               </span>
          </div>
          </div>
      )}

      <p className='font-semibold text-sm mt-1 bg-neutral-50 rounded-full px-2 py-1'>
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

        {/* 🔹 One-time drag hint (with soft looping animation) */}
        {!hasInteractedGallery && imageGallery.length > 3 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: [0.5, 1, 0.5], y: [16, 0, 8] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 rounded-full bg-black/55 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm shadow-md"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/40 text-[10px]">
                ⇆
              </span>
              <span>Drag to explore all photos</span>
            </motion.div>
          </div>
        )}

        {/* Top-right actions */}
        <div className="absolute top-3 right-4 z-20 flex items-center gap-2 pointer-events-auto">
          <HeartButton
            listingId={id}
            currentUser={currentUser}
            inline
          />

          <ListingLikeButton
            listingId={id}
            currentUser={currentUser}
            initialLikesCount={likesCount}
            isInitiallyLiked={isLikedByCurrentUser}
            inline
          />

          <ShareButton 
            inline
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setShowSharePopup(true);
              setTimeout(() => setShowSharePopup(false), 2500);
            }}
          />
        </div>

        {/* 🎥 Pure video cover case */}
        {videoSrc && imageGallery.length === 0 && (
          <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden bg-transparent">
            <video
              src={videoSrc}
              className={`absolute inset-0 w-full h-full ${
                videoOrientation === 'portrait'
                  ? 'object-contain'
                  : 'object-cover object-center'
              }`}
              autoPlay
              muted
              loop
              playsInline
              onLoadedMetadata={handleVideoMetadata}
              onClick={() => handleMediaClick(videoSrc)}
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
        {imageGallery.length > 0 && (!hasSingleImage || videoSrc) && (
          <div
            ref={scrollerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onScroll={() => {
              if (!hasInteractedGallery) setHasInteractedGallery(true);
            }}
            onWheel={() => {
              if (!hasInteractedGallery) setHasInteractedGallery(true);
            }}
            onClickCapture={(e) => {
              if (suppressClick.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onDragStart={(e) => e.preventDefault()}
            className="
              relative flex w-full h-[70vh]
              overflow-x-auto overflow-y-hidden
              rounded-2xl
              touch-auto md:touch-pan-x
              scrollbar-thin
              select-none
              gap-2
            "
            style={{
              cursor: isDragging ? 'grabbing' : hasDraggedOnce.current ? 'auto' : 'grab',
            }}
          >
            {(() => {
              const primaryImage = imageGallery[0];
              const secondaryImages = imageGallery.slice(1);

              const gridSlides: string[][] = [];
              for (let i = 0; i < secondaryImages.length; i += 4) {
                gridSlides.push(secondaryImages.slice(i, i + 4));
              }

              return (
                <>
                  {/* First slide: video or cover + grid */}
                  <div className="flex min-w-full flex-none gap-2 flex-col md:flex-row">
                    {/* Primary media — full width on mobile, left column on md+ */}
                    <div className="relative w-full h-full md:flex-1 group overflow-hidden rounded-2xl">
                      {videoSrc ? (
                        <video
                          src={videoSrc}
                          className={`w-full h-full rounded-2xl ${
                            videoOrientation === 'portrait'
                              ? 'object-cover bg-transparent'
                              : 'object-cover object-center'
                          }`}
                          autoPlay
                          muted
                          loop
                          playsInline
                          onLoadedMetadata={handleVideoMetadata}
                          onClick={() => handleMediaClick(videoSrc)}
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
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 60vw"
                              priority
                            />
                          </div>
                        )
                      )}
                    </div>

                    {/* Right grid – stylish mobile strip, 2x2 on md+ */}
                    {/* Right grid – 2 images on mobile, 4 in a 2x2 on md+ */}
                    {gridSlides[0] && (
                      <div
                        className="
                          w-full md:flex-1
                          grid gap-2
                          grid-cols-2 grid-rows-1
                          h-[18vh] md:h-full
                          md:grid-rows-2
                        "
                      >
                        {gridSlides[0].map((src, index) => (
                          <div
                            key={src + index}
                            className={`
                              relative w-full h-full cursor-pointer group overflow-hidden rounded-xl
                              ${index >= 2 ? 'hidden md:block' : ''}
                            `}
                            onClick={() => handleMediaClick(src)}
                          >
                            <Image
                              src={src}
                              alt={`gallery-${index}`}
                              fill
                              className="object-cover select-none"
                              sizes="(max-width: 768px) 50vw, 40vw"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Extra slides */}
                  {gridSlides.slice(1).map((slideImages, slideIndex) => {
                    const isSingle = slideImages.length === 1;
                    const slideKey = `slide-${slideIndex}`;

                    if (isSingle) {
                      const src = slideImages[0];
                      return (
                        <div
                          key={slideKey}
                          className="min-w-full h-[70vh] flex flex-none px-1"
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
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={slideKey}
                        className="
                          min-w-full flex-none
                          grid grid-cols-2 grid-rows-2 gap-2
                          h-[70vh]
                          px-1
                        "
                      >
                        {slideImages.map((src, index) => (
                          <div
                            key={src + index}
                            className="relative w-full h-full cursor-pointer group overflow-hidden rounded-xl"
                            onClick={() => handleMediaClick(src)}
                          >
                            <Image
                              src={src}
                              alt={`gallery-extra-${slideIndex}-${index}`}
                              fill
                              className="object-cover select-none"
                              sizes="(max-width: 768px) 50vw, 50vw"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
              background: 'rgba(0,0,0,0.05)',
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
        controller={{
          closeOnBackdropClick: true, // backdrop click still closes
        }}
        slides={mediaSlides}
        toolbar={{ buttons: ["close"] }} // top-right close button
        animation={{ fade: 300, swipe: 450 }}
        styles={{
          container: {
            backgroundColor: "transparent"
          },
        }}
        render={{
          slide: ({ slide }) => {
            const typed = slide as { src: string; kind?: "image" | "video" };

            return (
              // ✅ clicking anywhere on this wrapper (outside image/video) closes
              <div
                className="w-full h-full flex items-center justify-center bg-transparent"
                onClick={() => setLightboxOpen(false)}
              >
                {typed.kind === "video" ? (
                  <video
                    src={typed.src}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                    controls
                    autoPlay
                    muted
                    // ❗ stop click from bubbling so video controls don't close lightbox
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={typed.src}
                    alt=""
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                    // ❗ same here, click on image should not close
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            );
          },
          iconPrev: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" className="pointer-events-none">
              <path
                d="M15 18l-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          iconNext: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" className="pointer-events-none">
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
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
