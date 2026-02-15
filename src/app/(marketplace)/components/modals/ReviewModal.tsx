'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IoMdClose } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import { PiQuotesFill } from "react-icons/pi";
import Avatar from "../Avatar";
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Slider from "react-slick";
import { profilePathForUser } from "@/app/(marketplace)/utils/profilePath";

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reviews: {
    rating: number;
    comment: string;
    userName: string;
    userImage?: string;
    images?: string[];
    username?: string | null;
    legalName?: string | null;
    role?: string | null;
    createdAt: string;
  }[];
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,

  reviews
}) => {
  const [showModal, setShowModal] = useState(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const [reviewLightboxOpen, setReviewLightboxOpen] = useState(false);
  const [reviewLightboxSlides, setReviewLightboxSlides] = useState<{ src: string }[]>([]);
  const [reviewLightboxIndex, setReviewLightboxIndex] = useState(0);
  const [reviewLightboxMeta, setReviewLightboxMeta] = useState<{
    comment: string;
    userName: string;
    username?: string | null;
    rating: number;
  } | null>(null);


  // useEffect(() => {
  //   setShowModal(isOpen);
  // }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
    } else {
      const timeout = setTimeout(() => setShowModal(false), 250); // match transition duration
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
  
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);  

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
         const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);  

  const reviewImageSliderSettings = useMemo(
    () => ({
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      dots: true,
      swipeToSlide: true,
      adaptiveHeight: true,
    }),
    []
  );

  const openReviewLightbox = useCallback(
    (
      review: { comment: string; userName: string; legalName?: string | null; username?: string | null; rating: number; images?: string[] },
      startIndex: number
    ) => {
      const images = Array.isArray(review.images) ? review.images.filter(Boolean) : [];
      setReviewLightboxSlides(images.map((src) => ({ src })));
      setReviewLightboxIndex(Math.max(0, Math.min(startIndex, images.length - 1)));
      setReviewLightboxMeta({
        comment: review.comment,
        userName: review.legalName || review.userName,
        username: review.username ?? null,
        rating: review.rating,
      });
      setReviewLightboxOpen(true);
    },
    []
  );

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-5 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                key="reviews-modal"
                ref={modalRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-4xl bg-white rounded-3xl shadow-lg relative max-h-[80vh] overflow-hidden flex flex-col"
              >
                <div className="flex justify-between items-center border-b pb-4 mb-0 p-6">
                  <div className="flex items-center gap-2">
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
                    <span className="text-xl text-neutral-700 font-medium">
                      {averageRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button onClick={onClose} className="hover:opacity-70 transition">
                    <IoMdClose size={24} />
                  </button>
                </div>
  
                <div className="flex-1 overflow-y-auto scroll-smooth px-6 pb-6">
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                  {reviews.map((review, i) => {
                    const reviewImages = Array.isArray(review.images)
                      ? review.images.filter(Boolean)
                      : [];
                    const reviewProfileHref = profilePathForUser(
                      { username: review.username, role: review.role },
                      null,
                      review.role
                    );
                    // const displayLegalName = review.legalName || review.userName || 'Anonymous';
                    const displayUsername = review.username ? `@${review.username}` : null;

                    return (
                    <div
                      key={i}
                      className="rounded-3xl p-4 shadow-md hover:shadow-lg transition w-full md:w-fit md:max-w-sm md:justify-self-start"
                    >
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg ${star <= review.rating ? "text-black" : "text-gray-300"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
  
                      <p className="text-neutral-700">{review.comment}</p>

                      {reviewImages.length > 0 && (
                        <div className="mt-5 overflow-hidden rounded-2xl">
                          <Slider {...reviewImageSliderSettings}>
                            {reviewImages.map((src, index) => (
                              <button
                                type="button"
                                key={`${src}-${index}`}
                                onClick={() => openReviewLightbox(review, index)}
                                className="relative block w-full overflow-hidden focus:outline-none"
                              >
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.35, ease: "easeOut" }}
                                  className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-neutral-100 md:aspect-square md:max-w-sm md:mx-auto"
                                >
                                  <img
                                    src={src}
                                    alt={`Review by ${review.userName}`}
                                    className="h-full w-full object-cover"
                                  />
                                </motion.div>
                              </button>
                            ))}
                          </Slider>
                        </div>
                      )}
  
                      <div className="flex items-center gap-3 mt-4">
                        {review.userImage ? (
                          <Avatar src={review.userImage} name={review.userName} size={30} />
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-black">
                            {review.userName?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          {reviewProfileHref ? (
                            <Link
                              href={reviewProfileHref}
                              className="text-sm font-semibold text-neutral-800 hover:underline"
                            >
                              {displayUsername}
                              {/* {displayUsername ? ` · ${displayUsername}` : ''} */}
                            </Link>
                          ) : (
                            <p className="text-sm font-semibold text-neutral-800">
                              {displayUsername}
                              {/* {displayUsername ? ` · ${displayUsername}` : ''} */}
                            </p>
                          )}
                          <p className="text-xs text-neutral-500">
                            {new Date(review.createdAt).toLocaleString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
                </div>
                <div className="flex flex-col gap-2 p-8 border-t">
                  <div className="flex justify-center w-full">
                </div>
                <div className="flex flex-row gap-2 justify-center items-start">
                  <PiQuotesFill className="text-xl md:text-base" />
                  <p className="text-sm text-left md:text-center">
                    Service is the bridge that moves you closer to the joy and value behind every moment.
                  </p>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <Lightbox
        open={reviewLightboxOpen}
        close={() => setReviewLightboxOpen(false)}
        slides={reviewLightboxSlides}
        index={reviewLightboxIndex}
        animation={{ fade: 300, swipe: 450 }}
        carousel={{ finite: false }}
        render={{
          slide: ({ slide }) => {
            const typed = slide as { src: string };

            return (
              <div
                className="relative flex h-full w-full items-center justify-center"
                onClick={() => setReviewLightboxOpen(false)}
              >
                <img
                  src={typed.src}
                  alt=""
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  onClick={(event) => event.stopPropagation()}
                />
                {reviewLightboxMeta && (
                  <div className="pointer-events-none absolute bottom-6 left-1/2 w-[90%] max-w-3xl -translate-x-1/2 rounded-2xl bg-black/70 px-6 py-4 text-center text-white backdrop-blur-sm">
                    <p className="text-sm md:text-base">{reviewLightboxMeta.comment}</p>
                    <p className="mt-2 text-xs text-white/80">
                      {reviewLightboxMeta.userName}
                      {reviewLightboxMeta.username ? ` · @${reviewLightboxMeta.username}` : ''} · {reviewLightboxMeta.rating}★
                    </p>
                  </div>
                )}
              </div>
            );
          },
        }}
        styles={{
          container: { backgroundColor: "rgba(0,0,0,0.6)" },
        }}
      />
    </>
  );  
};

export default ReviewsModal;
