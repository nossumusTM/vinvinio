'use client';

import { toast } from "react-hot-toast";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';
import Button from "../components/Button";
import type { Range, RangeKeyDict } from 'react-date-range';
import { AnimatePresence, motion } from 'framer-motion';

import { SafeReservation, SafeUser } from "@/app/(marketplace)/types";
import { TbCalendarTime, TbUserScan, TbClock, TbUserSquareRounded, TbMessageDots } from "react-icons/tb";
import useMessenger from "@/app/(marketplace)/hooks/useMessager";
import { CiPaperplane } from "react-icons/ci";
import { TbMessage2Code } from "react-icons/tb";
import { BiSolidPaperPlane } from "react-icons/bi";
import { FaPaperPlane } from "react-icons/fa";
// import { profilePathForUser } from "@/app/(marketplace)/utils/profilePath";

import Heading from "@/app/(marketplace)/components/Heading";
import Container from "@/app/(marketplace)/components/Container";
import Avatar from "@/app/(marketplace)/components/Avatar";
import ConfirmPopup from "../components/ConfirmPopup";
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import Modal from "../components/modals/Modal";
import FilterTrips from "./FilterTrips";
import formatReservationDateRange from "../utils/dateRange";

import { AxiosError } from 'axios';

import Image from "next/image";

interface TripsClientProps {
  reservations: SafeReservation[];
  currentUser?: SafeUser | null;
}

type ReviewDraft = {
  rating: number;
  comment: string;
  images: string[];
  hoverRating?: number;
};

type SubmittedReview = {
  rating: number;
  comment: string;
  images: string[];
};

const REVIEW_MAX_IMAGES = 5;
const REVIEW_MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const reviewUploadPreset = 'vuolapreset';
const reviewCloudName = 'dlomv0hbe';

const TripsClient: React.FC<TripsClientProps> = ({
  reservations,
  currentUser,
}) => {
  const router = useRouter();
  const { formatConverted } = useCurrencyFormatter();
  const [deletingId, setDeletingId] = useState('');
  const [hostImages, setHostImages] = useState<Record<string, string>>({});
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [reviewInputs, setReviewInputs] = useState<Record<string, ReviewDraft>>({});
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, SubmittedReview>>({});
  const [reviewUploading, setReviewUploading] = useState<Record<string, boolean>>({});

  const [loadedReservations, setLoadedReservations] = useState(reservations);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(reservations.length === 4);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterWrapperRef = useRef<HTMLDivElement | null>(null);

  const [filterKeyword, setFilterKeyword] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [filteredReservations, setFilteredReservations] = useState<SafeReservation[] | null>(null);

  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0–11

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [isTimeEnabled, setIsTimeEnabled] = useState(true);

  const yearOptions = useMemo(() => {
    const baseYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, index) => baseYear - 2 + index);
  }, []);

  // const filteredReservations = useMemo(() => {
  //   if (!filterKeyword) {
  //     return loadedReservations;
  //   }

  //   const normalized = filterKeyword.toLowerCase();
  //   return loadedReservations.filter((reservation) => {
  //     const keywords = reservation.listing?.seoKeywords ?? [];
  //     return keywords.some((keyword) => keyword?.toLowerCase().includes(normalized));
  //   });
  // }, [loadedReservations, filterKeyword]);

  const messenger = useMessenger();

  const profileButtonClasses =
    'group flex w-full items-center gap-3 rounded-full text-left outline-none transition focus-visible:ring-2 focus-visible:ring-black/40';

 const makeNavigationHandler = useCallback(
   (path: string | null | undefined) =>
     (event?: ReactMouseEvent<HTMLElement>) => {
        if (!path) {
          return;
        }

        if (event?.button === 1) {
          event.preventDefault();
          window.open(path, '_blank', 'noopener,noreferrer');
          return;
        }

        if (event?.metaKey || event?.ctrlKey) {
          window.open(path, '_blank', 'noopener,noreferrer');
          return;
        }

        router.push(path);
      },
    [router]
  );

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelConfirmPrompt, setShowCancelConfirmPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [navigationPrompt, setNavigationPrompt] = useState<{ path: string; title: string } | null>(null);
  const cancelOptions = [
    "Change of plans",
    "Found a better deal",
    "Unexpected emergency",
    "Date/time conflict",
    "Issue with host",
    "Prefer different experience",
    "Other"
  ];

  // const onCancel = useCallback(
  //   (id: string) => {
  //     setDeletingId(id);

  //     axios
  //       .delete(`/api/reservations/${id}`)
  //       .then(() => {
  //         toast.success('Reservation cancelled!', {
  //           iconTheme: {
  //               primary: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)',
  //               secondary: '#fff',
  //           }
  //       });
  //         router.refresh();
  //       })
  //       .catch((error) => {
  //         toast.error(error?.response?.data?.error);
  //       })
  //       .finally(() => {
  //         setDeletingId('');
  //       });
  //   },
  //   [router]
  // );

  // const handleSubmitCancellation = async () => {
  //   if (!selectedReservationId || !cancelReason) return;
  
  //    if (cancelReason === 'Other' && !customReason.trim()) {
  //     setPopupMessage("Please share your reason for cancellation.");
  //     return;
  //   }

  //   setIsSubmittingCancellation(true);

  //   const reasonToSend = cancelReason === 'Other' ? customReason.trim() : cancelReason;
  //   const reservation = reservations.find(r => r.id === selectedReservationId);
  //   const formattedDate = format(new Date(reservation?.startDate || ''), 'PPP');
  
  //   const submitDate = format(new Date(), 'PPpp');

  //   const emailText = `
  //   🗓️ Reservation Cancellation Request

  //   📌 Submitted On: ${submitDate}

  //   👤 User Information:
  //   - Username: ${currentUser?.name}
  //   - Legal Name: ${currentUser?.legalName}
  //   - Email: ${currentUser?.email}

  //   🧾 Reservation Details:
  //   - Reservation ID: ${selectedReservationId}
  //   - Guest Count: ${reservation?.guestCount}
  //   - Price: ${formatConverted(reservation?.totalPrice ?? 0)}
  //   - Date of Reservation: ${formattedDate}

  //   ❗ Reason for Cancellation:
  //   ${reasonToSend}
  //   `.trim();
  
  //   try {
  //     await axios.post('/api/email/cancellation', {
  //       to: 'vuoiaggio@gmail.com',
  //       subject: `Cancellation request for reservation ${selectedReservationId}`,
  //       bodyText: emailText,
  //     });
  //     toast.success('Cancellation request submitted.', {
  //       iconTheme: {
  //         primary: '#2200ffff',
  //         secondary: '#fff',
  //       }
  //     });
  //     setShowCancelModal(false);
  //     setShowCancelConfirmPrompt(false);
  //     setCancelReason('');
  //     setCustomReason('');
  //     setSelectedReservationId(null);
  //   } catch (err) {
  //     toast.error('Failed to send cancellation email.');
  //   } finally {
  //     setIsSubmittingCancellation(false);
  //   }
  // };  

  const handleSubmitCancellation = async () => {
    if (!selectedReservationId || !cancelReason) return;

    if (cancelReason === 'Other' && !customReason.trim()) {
      setPopupMessage("Please share your reason for cancellation.");
      return;
    }

    const reservation = reservations.find((r) => r.id === selectedReservationId);

    if (!reservation || !reservation.startDate) {
      setPopupMessage('We could not find details for this reservation. Please try again.');
      return;
    }

    setIsSubmittingCancellation(true);

    const reasonToSend = cancelReason === 'Other' ? customReason.trim() : cancelReason;
    // const formattedDate = format(new Date(reservation.startDate), 'PPP');
    const formattedDate = formatReservationDateRange(reservation.startDate, reservation.endDate);
    const submitDate = format(new Date(), 'PPpp');

    const emailText = `
      🗓️ Reservation Cancellation Request

      📌 Submitted On: ${submitDate}

      👤 User Information:
      - Username: ${currentUser?.name}
      - Legal Name: ${currentUser?.legalName}
      - Email: ${currentUser?.email}

      🧾 Reservation Details:
      - Reservation ID: ${selectedReservationId}
      - Guest Count: ${reservation.guestCount}
      - Price: ${formatConverted(reservation.totalPrice ?? 0)}
      - Date of Reservation: ${formattedDate}

      ❗ Reason for Cancellation:
      ${reasonToSend}
    `.trim();

    try {
      await axios.post('/api/email/cancellation', {
        to: 'vuoiaggio@gmail.com',
        subject: `Cancellation request for reservation ${selectedReservationId}`,
        bodyText: emailText,
      });
      toast.success('Cancellation request submitted.', {
        iconTheme: {
          primary: '#2200ffff',
          secondary: '#fff',
        },
      });
      setShowCancelModal(false);
      setShowCancelConfirmPrompt(false);
      setCancelReason('');
      setCustomReason('');
      setSelectedReservationId(null);
    } catch (err) {
      toast.error('Failed to send cancellation email.');
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  const openCancelModal = useCallback((id: string) => {
    setSelectedReservationId(id);
    setCancelReason('');
    setCustomReason('');
    setShowCancelConfirmPrompt(false);
    setShowCancelModal(true);
  }, []);  

  const handleCloseCancelModal = useCallback(() => {
    setShowCancelModal(false);
    setShowCancelConfirmPrompt(false);
  }, []);

  const requestCancellationSubmission = useCallback(() => {
    if (!cancelReason) {
      setPopupMessage('Please choose a reason before sending.');
      return;
    }
    if (cancelReason === 'Other' && !customReason.trim()) {
      setPopupMessage('Please share a few words about your reason.');
      return;
    }
    setShowCancelConfirmPrompt(true);
  }, [cancelReason, customReason]);

  const handleNavigationPrompt = useCallback((path: string | null, title: string) => {
    if (!path) return;
    setNavigationPrompt({ path, title });
  }, []);

  const confirmNavigation = useCallback(() => {
    if (!navigationPrompt) return;
    router.push(navigationPrompt.path);
    setNavigationPrompt(null);
  }, [navigationPrompt, router]);

  const cancelNavigation = useCallback(() => setNavigationPrompt(null), []);
  
  // const onCancel = useCallback(async (id: string) => {
  //   if (currentUser?.role !== 'moder') return;
  
  //   try {
  //     setDeletingId(id);
  
  //     // Fetch reservation to get potential referenceId
  //     const res = await axios.get(`/api/reservations/${id}`);
  //     const reservation = res.data;
  //     const referralId = reservation?.referralId;
  //     const totalPrice = reservation?.totalPrice ?? 0;
  
  //     // Cancel reservation
  //     await axios.delete(`/api/reservations/${id}`);
  //     toast.success('Reservation cancelled!', {
  //       iconTheme: {
  //         primary: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)',
  //         secondary: '#fff',
  //       }
  //     });
  
  //     // Update referral analytics if referenceId exists
  //     if (referralId) {
  //       await axios.post('/api/analytics/decreament', {
  //         reservationId: id,
  //         totalBooksIncrement: -1,
  //         totalRevenueIncrement: -totalPrice,
  //       });
  //     }
  
  //     router.refresh();
  //   } catch (error) {
  //     const err = error as AxiosError<{ error?: string }>;
  //     toast.error(err.response?.data?.error || 'Cancellation failed.');
  //   } finally {
  //     setDeletingId('');
  //   }
  // }, [router, currentUser]);

  const buildReviewDraft = (draft?: ReviewDraft): ReviewDraft => ({
    rating: draft?.rating ?? 0,
    comment: draft?.comment ?? '',
    images: draft?.images ?? [],
    hoverRating: draft?.hoverRating ?? 0,
  });

  const handleReviewImageUpload = async (reservationId: string, fileList: FileList | null) => {
    if (!fileList) return;

    const existingDraft = buildReviewDraft(reviewInputs[reservationId]);

    if (existingDraft.images.length >= REVIEW_MAX_IMAGES) {
      setPopupMessage(`You can upload up to ${REVIEW_MAX_IMAGES} images per review.`);
      return;
    }

    const files = Array.from(fileList).slice(0, REVIEW_MAX_IMAGES - existingDraft.images.length);
    const oversizeFile = files.find((file) => file.size > REVIEW_MAX_IMAGE_SIZE);

    if (oversizeFile) {
      setPopupMessage('Each image must be 2MB or less.');
      return;
    }

    setReviewUploading((prev) => ({ ...prev, [reservationId]: true }));

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', reviewUploadPreset);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${reviewCloudName}/auto/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (data?.secure_url) {
          uploadedUrls.push(data.secure_url as string);
        } else {
          throw new Error('Upload failed');
        }
      } catch (err) {
        console.error('Review image upload failed', err);
        setPopupMessage('Failed to upload one or more images. Please try again.');
        break;
      }
    }

    setReviewInputs((prev) => ({
      ...prev,
      [reservationId]: {
        ...buildReviewDraft(prev[reservationId]),
        images: [...existingDraft.images, ...uploadedUrls].slice(0, REVIEW_MAX_IMAGES),
      },
    }));

    setReviewUploading((prev) => ({ ...prev, [reservationId]: false }));
  };

  const handleRemoveReviewImage = (reservationId: string, imageUrl: string) => {
    setReviewInputs((prev) => {
      const draft = buildReviewDraft(prev[reservationId]);
      return {
        ...prev,
        [reservationId]: {
          ...draft,
          images: draft.images.filter((img) => img !== imageUrl),
        },
      };
    });
  };

  const handleReviewSubmit = async (reservationId: string, listingId: string) => {
    const { rating, comment, images } = buildReviewDraft(reviewInputs[reservationId]);
  
    if (!rating || !comment) {
      setPopupMessage("Please provide a rating and a comment.");
      return;
    }

    if (reviewUploading[reservationId]) {
      setPopupMessage('Please wait for images to finish uploading.');
      return;
    }
  
    try {
      await axios.post('/api/reviews', {
        reservationId,
        listingId,
        rating,
        comment,
        images,
      });
  
      toast.success('Review submitted!', {
        iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
        },
      });

      setSubmittedReviews((prev) => ({
        ...prev,
        [reservationId]: { rating, comment, images },
      }));
      
      router.refresh();
    } catch (error) {
      setPopupMessage("Failed to submit review.");
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      const reviews: Record<string, SubmittedReview> = {};
  
      for (const reservation of reservations) {
        try {
          const res = await fetch('/api/reviews/get-by-reservation', {
            method: 'POST',
            body: JSON.stringify({ reservationId: reservation.id }),
          });
        
          const data = await res.json();
        
          if (data && data.rating !== undefined && data.comment !== undefined) {
            reviews[reservation.id] = {
              rating: data.rating,
              comment: data.comment,
              images: Array.isArray(data.images) ? data.images : [],
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch review for reservation ${reservation.id}`, err);
        }        
      }
  
      setSubmittedReviews(reviews);
    };
  
    fetchReviews();
  }, [reservations]);  

  const loadMoreReservations = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await axios.get(`/api/reservations/load?skip=${page * 4}&take=4`);
      const newData = res.data;
      setLoadedReservations((prev) => [...prev, ...newData]);
      setPage((prev) => prev + 1);
      if (newData.length < 4) {
        setHasMore(false);
      }
    } catch (err) {
      toast.error("Failed to load more reservations.");
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  const applyTripsFilter = useCallback(async () => {
    setIsFilterLoading(true);

    try {
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0); // last day of month
      const timePayload = isTimeEnabled ? selectedTime || null : null;

      const response = await axios.post('/api/trips/filter', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        time: timePayload,
        year: selectedYear,
      });

      setFilteredReservations(response.data ?? []);
      setFilterKeyword('activities');
    } catch (error) {
      const err = error as AxiosError<{ error?: string; message?: string }>;
      console.error('🔴 /api/trips/filter failed:', {
        status: err.response?.status,
        data: err.response?.data,
      });

      toast.error(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to filter your activities right now.'
      );
    } finally {
      setIsFilterLoading(false);
    }
  }, [isTimeEnabled, selectedMonth, selectedTime, selectedYear]);

  const resetTripsFilter = useCallback(() => {
    setIsFilterLoading(true);
    setFilterKeyword(null);
    setFilteredReservations(null);
    setSelectedTime('12:00');
    setIsTimeEnabled(true);
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setTimeout(() => setIsFilterLoading(false), 200);
  }, [currentMonth, currentYear]);


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 50 && hasMore && !loadingMore) {
        loadMoreReservations();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, loadMoreReservations]);

    useEffect(() => {
    if (!isFilterOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const wrapper = filterWrapperRef.current;
      if (!wrapper) return;
      if (!wrapper.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isFilterOpen]);

  const showLoadMore = hasMore && !filteredReservations;
  const reservationsToRender = filteredReservations ?? loadedReservations;

    return (
      <>
      <Container className="py-10">
  <div className="pageadjust px-5 space-y-6">
    <div className="mb-8 space-y-2 rounded-3xl border border-neutral-200 bg-white/90 shadow-md p-6">
      <Heading
        title="Activities"
        subtitle="Tracing your steps — behind and ahead"
      />
      <p className="text-sm text-neutral-600">
        Use the filter bubble at the bottom to jump to a specific month, year, and time.
      </p>
    </div>

    {/* your grid of reservations stays as-is below */}
    <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
        {reservationsToRender.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-neutral-200 bg-white/70 p-10 text-center shadow-sm">
              <p className="text-base font-semibold text-neutral-900">
                No activities found for this filter.
              </p>
              <p className="text-sm text-neutral-600 mt-2">
                Try resetting the filter to view all of your trips.
              </p>
            </div>
          ) : (
            reservationsToRender.map((reservation: SafeReservation) => {
            const host = reservation.listing?.user;
            const hostNameClean = host?.username?.trim() || null;
            const hostName = hostNameClean ?? 'Unknown';
            const hostImage = host?.image ?? '';
            const hostId = host?.id ?? null;

            const slugify = (s: string) =>
              s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

            const handle =
              (typeof host?.username === 'string' && host.username.trim())
                ? host.username.trim()
                : (hostNameClean ? slugify(hostNameClean) : (hostId ?? ''));

            const hostProfilePath =
              host?.role === 'host'
                ? (handle ? `/provider/${encodeURIComponent(handle)}` : null)
                : (handle ? `/social-card/${encodeURIComponent(handle)}` : null);

            const handleHostNavigation = makeNavigationHandler(hostProfilePath);
            const listingPath = reservation.listing?.slug
              ? `/listings/${reservation.listing.slug}`
              : (reservation.listing?.id ? `/listings/${reservation.listing.id}` : null);
            const handleCardNavigation = () =>
              handleNavigationPrompt(listingPath, reservation.listing?.title ?? 'this listing');

            const reviewDraft = buildReviewDraft(reviewInputs[reservation.id]);
            const isUploadingReview = Boolean(reviewUploading[reservation.id]);

            const cancellationAttachments = Array.isArray(reservation.cancellationNoteAttachments)
              ? reservation.cancellationNoteAttachments.filter((item) => item && (item.data || item.url))
              : [];
            const hasCancellationNote = Boolean(reservation.cancellationNoteText?.trim()) || cancellationAttachments.length > 0;

          return (
              <div
                key={reservation.id}
                className="relative bg-white rounded-3xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden flex flex-col"
              >
              {/* ✅ Status Label with fallback */}
              {reservation.status === 'cancelled' ? (
                <div className="absolute top-4 left-4 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold uppercase rounded-lg shadow-md z-10">
                  Cancelled
                </div>
              ) : (
                <div className="absolute top-4 left-4 px-3 py-1 bg-green-100 text-green-600 text-xs font-bold uppercase rounded-lg shadow-md z-10">
                  Confirmed
                </div>
              )}
              {Array.isArray(reservation.listing.imageSrc) && reservation.listing.imageSrc.length > 0 && (
                <button
                  type="button"
                  onClick={() => listingPath && handleCardNavigation()}
                  className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  aria-label={listingPath ? `Open ${reservation.listing?.title ?? 'listing'} details` : undefined}
                  disabled={!listingPath}
                >
                  <Image
                    src={reservation.listing.imageSrc[0]}
                    alt="Listing"
                    className="w-full h-48 object-cover"
                    width={500}
                    height={500}
                  />
                </button>
              )}

              {reservation.status === 'cancelled' ? (
                <div className="absolute top-4 left-4 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold uppercase rounded-lg shadow-md z-10">
                  Cancelled
                </div>
              ) : (
                <div className="absolute top-4 left-4 px-3 py-1 bg-green-100 text-green-600 text-xs font-bold uppercase rounded-lg shadow-md z-10">
                  Confirmed
                </div>
              )}

              <div className="px-4 pt-2 pb-6 flex flex-col gap-2 text-black flex-1">
                <button
                  type="button"
                  onClick={() => listingPath && handleCardNavigation()}
                  className="p-4 text-left text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  aria-label={listingPath ? `Open ${reservation.listing?.title ?? 'listing'} details` : undefined}
                  disabled={!listingPath}
                >
                  {reservation.listing.title}
                </button>
                

              {/* Reservation Meta — stacked, left-aligned (same as ReservationCard) */}
              <div className="pt-2 pb-4 w-full max-w-md p-4 rounded-xl md:mx-0 mx-auto">
                <div className="flex flex-col ga">

                  {/* Guests */}
                  <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                        <TbUserSquareRounded className="text-neutral-700 text-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] uppercase tracking-wide text-neutral-500">Guests</p>
                        <p className="text-[15px] font-semibold text-neutral-900">
                          {reservation.guestCount}{' '}
                          <span className="font-normal text-neutral-700">
                            {reservation.guestCount === 1 ? 'Guest' : 'Guests'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="w-full rounded-2xl bg:white/90 backdrop-blur-md px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                        <TbCalendarTime className="text-neutral-700 text-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] uppercase tracking-wide text-neutral-500">Date</p>
                        <p className="text-[15px] font-semibold text-neutral-900 break-words">
                          {/* {format(new Date(reservation.startDate), 'PPP')} */}
                          {formatReservationDateRange(reservation.startDate, reservation.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                        <TbClock className="text-neutral-700 text-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] uppercase tracking-wide text-neutral-500">Time</p>
                        <p className="text-[15px] font-semibold text-neutral-900">
                          {(() => {
                            const [h, m] = reservation.time.split(':').map(Number);
                            const hour12 = (h % 12) || 12;
                            const ampm = h >= 12 ? 'PM' : 'AM';
                            return `${hour12}:${String(m ?? 0).padStart(2, '0')} ${ampm}`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {hasCancellationNote && (
                <div className="mx-4 mt-2 w-[calc(100%-2rem)] rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                  <p className="font-semibold">Cancellation details</p>
                  {reservation.cancellationNoteText ? (
                    <p className="whitespace-pre-line text-rose-900">{reservation.cancellationNoteText}</p>
                  ) : (
                    <p className="text-rose-800">No note provided.</p>
                  )}

                  {cancellationAttachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Attachment</p>
                      <div className="flex flex-wrap gap-3">
                        {cancellationAttachments.map((attachment, index) => {
                          const src = attachment.data || attachment.url;
                          const isImage = typeof src === 'string' && src.startsWith('data:image');

                          return (
                            <div
                              key={`trip-cancel-attachment-${index}`}
                              className="flex min-w-[160px] max-w-[220px] flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm ring-1 ring-rose-200"
                            >
                              {isImage && src ? (
                                <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-200">
                                  <Image
                                    src={src}
                                    alt={attachment.name || 'Attachment preview'}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200">
                                  <span className="text-sm">📎</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate">{attachment.name || 'Attachment'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

                 {/* <div className="text-sm text-neutral-600">{reservationDate}</div> */}

                {/* <div className="text-sm text-neutral-600 mt-4 flex flex-row gap-1 align-center justify-center">
                  <p className="text-md text-black">
                    {reservation.guestCount === 1 ? 'Traveller:' : 'Travellers:'}
                  </p>
                  <div className="text-md font-bold">
                    {reservation.guestCount ?? 'N/A'}
                  </div>
                </div>

                <div className="flex flex-row gap-2 text-sm text-neutral-600 font-bold shadow-md mx-10 justify-center rounded-xl p-4">

                  <div className="pt-0.5 flex flex-row gap-2 justify-center items-center">{format(new Date(reservation.startDate), 'PPP')}
                  <div className="">{reservation.time}{' '}
                    {(() => {
                      const hour = parseInt(reservation.time.split(':')[0], 10);
                      return hour >= 12 ? 'PM' : 'AM';
                    })()}</div>
                  </div>
                </div> */}

                {/* <div className="flex flex-row gap-2 text-lm text-neutral-600 font-bold">
                  <div className="text-2xl"><TbClock /></div>
                  <div className="pt-0.5">{reservation.time}{' '}
                {(() => {
                  const hour = parseInt(reservation.time.split(':')[0], 10);
                  return hour >= 12 ? 'PM' : 'AM';
                })()}</div>
                </div> */}

                {/* <hr className="mt-3 mb-6 w-screen relative left-1/2 right-1/2 -translate-x-1/2 border-t border-neutral-200" /> */}
                {/* Host row — aligned with Guests / Date / Time */}
                <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-8 py-0">
                  {hostProfilePath ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleHostNavigation(event);
                      }}
                      onAuxClick={(event) => {
                        event.stopPropagation();
                        handleHostNavigation(event);
                      }}
                      className={profileButtonClasses}
                      title="Open host profile"
                    >
                      <span className="shrink-0 rounded-full bg-white/80 p-0.5">
                        <Avatar src={hostImage} name={hostName} size={36} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[8px] uppercase tracking-wide text-neutral-500 leading-none">
                          Hosted by
                        </span>
                        <span className="truncate text-[15px] font-semibold text-neutral-900 leading-tight group-hover:border-b border-neutral-800 transition group-focus-visible:border-b">
                          {hostName}
                        </span>
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 rounded-full">
                        <Avatar src={hostImage} name={hostName} size={36} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-wide text-neutral-500 leading-none">
                          Hosted by
                        </p>
                        <span className="text-[15px] font-semibold text-neutral-900 truncate leading-tight">
                          {hostName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-0 pt-4">
                 <div className="flex justify-center px-6 pb-4 pt-4">
                   <Button
                     label="Send a Message"
                     onClick={(e) => {
                       if (currentUser?.id === host?.id) return;
                       messenger.openChat({
                         id: host?.id ?? "",
                         name: hostName,
                         image: hostImage || undefined,
                       });
                     }}
                     disabled={currentUser?.id === host?.id}
                     outline
                     small
                   />
                 </div>
                  <hr className="my-4" />
                  <div className="min-h-[88px] grid place-items-center px-6 text-center">
                    {new Date(reservation.startDate) > new Date(Date.now() + 24 * 60 * 60 * 1000) ? (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openCancelModal(reservation.id);
                        }}
                        disabled={deletingId === reservation.id}
                        className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:shadow-md transition disabled:opacity-50"
                      >
                        Need to cancel for some reason?
                      </button>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        This booking is no longer subject to cancellation. Please review our{' '}
                        <button
                          onClick={() => {
                            const footer = document.getElementById("vuoiaggio-footer");
                            footer?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          cancellation policy
                        </button>
                        .
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {currentUser?.role === 'customer' && (
                <div className="mt-4 border-t pt-6 flex flex-col items-center justify-center text-center">
                  {submittedReviews[reservation.id] ? (
                    <>
                      <p className="text-md font-semibold text-black mb-2">Review submitted, thanks!</p>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-2xl ${
                              star <= submittedReviews[reservation.id].rating ? 'text-[#2200ffff]' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-700 italic px-6 mb-6">
                        “{submittedReviews[reservation.id].comment}”
                      </p>
                      {submittedReviews[reservation.id].images?.length ? (
                        <div className="grid grid-cols-3 gap-2 px-6 mb-4">
                          {submittedReviews[reservation.id].images.map((img) => (
                            <div key={img} className="relative h-20 w-20 overflow-hidden rounded-xl">
                              <Image
                                src={img}
                                alt="Review attachment"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <p className="text-md font-semibold mb-2">Leave a Review</p>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            onMouseEnter={() =>
                              setReviewInputs((prev) => ({
                                ...prev,
                                [reservation.id]: {
                                  ...buildReviewDraft(prev[reservation.id]),
                                  hoverRating: star,
                                },
                              }))
                            }
                            onMouseLeave={() =>
                              setReviewInputs((prev) => ({
                                ...prev,
                                [reservation.id]: {
                                  ...buildReviewDraft(prev[reservation.id]),
                                  hoverRating: 0,
                                },
                              }))
                            }
                            onClick={() =>
                              setReviewInputs((prev) => ({
                                ...prev,
                                [reservation.id]: {
                                  ...buildReviewDraft(prev[reservation.id]),
                                  rating: star,
                                },
                              }))
                            }
                            className={`cursor-pointer text-2xl transition-colors ${
                              star <= (reviewDraft.hoverRating || reviewDraft.rating)
                                ? 'text-[#2200ffff]'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex w-[250px] mb-4">
                        <textarea
                          rows={3}
                          placeholder="Write your review..."
                          className="w-full p-2 border border-neutral-300 rounded-xl mb-2"
                          value={reviewDraft.comment}
                          onChange={(e) =>
                            setReviewInputs((prev) => ({
                              ...prev,
                              [reservation.id]: {
                                ...buildReviewDraft(prev[reservation.id]),
                                comment: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2 w-full max-w-sm mb-4">
                        <label
                          htmlFor={`review-images-${reservation.id}`}
                          className="text-sm font-semibold text-neutral-800"
                        >
                          Add up to {REVIEW_MAX_IMAGES} images (max 2MB each)
                        </label>
                        <input
                          id={`review-images-${reservation.id}`}
                          type="file"
                          accept="*/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleReviewImageUpload(reservation.id, e.target.files)}
                        />
                        <div className="flex flex-col items-center gap-3">
                          <button
                            type="button"
                            onClick={() => document.getElementById(`review-images-${reservation.id}`)?.click()}
                            className="px-4 py-2 bg-white border border-neutral-300 text-sm rounded-xl hover:bg-neutral-50 disabled:opacity-50"
                            disabled={isUploadingReview}
                          >
                            {isUploadingReview ? 'Uploading…' : 'Upload images'}
                          </button>
                          <p className="text-xs text-neutral-500">Accepts any file format under 2MB.</p>
                        </div>

                        {reviewDraft.images?.length ? (
                          <div className="grid grid-cols-3 gap-3">
                            {reviewDraft.images?.map((img) => (
                              <div key={img} className="relative h-20 w-20 overflow-hidden rounded-xl">
                                <Image
                                  src={img}
                                  alt="Review upload"
                                  fill
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReviewImage(reservation.id, img)}
                                  className="absolute top-1 right-1 bg-white/90 text-black rounded-full px-1 text-xs shadow"
                                  aria-label="Remove image"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <button
                        onClick={() => handleReviewSubmit(reservation.id, reservation.listing.id)}
                        className="px-4 py-2 mb-4 bg-black text-white text-sm rounded-xl hover:bg-neutral-800 disabled:opacity-50"
                        disabled={isUploadingReview}
                      >
                        Submit Review
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* {popupMessage && (
                <ConfirmPopup
                  title="Notice"
                  message={popupMessage}
                  confirmLabel="OK"
                  hideCancel
                  onConfirm={() => setPopupMessage(null)}
                />
              )} */}
            </div>
          );
        })
      )}
        
      </div>
      </div>

      {/* Bottom-center filter dropdown – anchored to button center */}
      <div ref={filterWrapperRef} className="fixed inset-x-0 bottom-4 z-40 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {/* This wrapper is the ONLY relative parent for the dropup */}
          <div className="relative inline-flex items-center justify-center">
            {/* Trigger pill */}
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-transparent backdrop-blur-3xl text-neutral-900 px-5 py-3 shadow-lg transition text-sm font-semibold hover:shadow-xl"
            >
              <span className="inline-flex h-6 w-6 items-center shadow-md justify-center rounded-full text-[13px]">
                {isFilterOpen ? '–' : '+'}
              </span>
              <span>Filter By Date & Time</span>
            </button>

            {/* Dropup content — perfectly centered over the button */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                    style={{ left: '50%', x: '-50%' }}
                    className="
                      absolute
                      bottom-[calc(100%+12px)]
                      w-[min(100vw-32px,480px)]
                    "
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
                  >
                  <FilterTrips
                    activeKeyword={filterKeyword}
                    isLoading={isFilterLoading}
                    timeValue={selectedTime}
                    isTimeEnabled={isTimeEnabled}
                    selectedYear={selectedYear}
                    yearOptions={yearOptions}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    onTimeToggle={setIsTimeEnabled}
                    onTimeChange={setSelectedTime}
                    onYearChange={setSelectedYear}
                    onFilter={async () => {
                      await applyTripsFilter();
                      setIsFilterOpen(false);
                    }}
                    onReset={() => {
                      resetTripsFilter();
                      setIsFilterOpen(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>


      </Container>

     {showLoadMore && (
      <div className="flex justify-center mt-20">
        <button
          onClick={loadMoreReservations}
          disabled={loadingMore}
          className="px-6 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition text-sm"
        >
          {loadingMore ? (
            <div className="loader inline-block w-5 h-5 mt-1 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          ) : (
            "Load More"
          )}
        </button>
      </div>
    )}

      {navigationPrompt && (
        <ConfirmPopup
          title="Leave this page?"
          message={`You're about to open ${navigationPrompt.title || 'this listing'}. Continue?`}
          onCancel={cancelNavigation}
          onConfirm={() => {
            confirmNavigation();
        }}
        confirmLabel="Open listing"
      />
    )}

    {popupMessage && (
      <ConfirmPopup
        title="Notice"
        message={popupMessage}
        confirmLabel="OK"
        hideCancel
        onConfirm={() => setPopupMessage(null)}
      />
    )}

    {showCancelModal && (
      <Modal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onSubmit={requestCancellationSubmission}
        closeOnSubmit={false}
        actionLoading={isSubmittingCancellation}
        submitOnEnter={false}
        title="Cancel Reservation"
        actionLabel="Send Request"
        className="max-h-[60vh]"
        body={
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
              <h3 className="text-lg font-semibold text-neutral-900">Need to cancel?</h3>
              <p className="text-sm text-neutral-600 mt-1">
                Tell us what happened so we can support you and notify the host in time.
              </p>
              <button
                type="button"
                onClick={() => {
                  const footer = document.getElementById('vuoiaggio-footer');
                  footer?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-3 inline-flex text-xs font-semibold text-neutral-700 underline decoration-dotted"
              >
                Review the cancellation policy
              </button>
            </div>

             <div className="grid gap-3">
              {cancelOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCancelReason(option)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left text-sm font-medium transition shadow-sm ${
                    cancelReason === option
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {cancelReason === 'Other' && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <label className="text-sm font-semibold text-neutral-800">Let us know more</label>
                <textarea
                  placeholder="Please specify your reason"
                  className="mt-2 w-full rounded-2xl border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  rows={4}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              </div>
            )}
          </div>
          }
      />
    )}

    {showCancelConfirmPrompt && (
      <ConfirmPopup
        title="Send this request?"
        message="We will email our team and the host with your cancellation reason."
        onCancel={() => setShowCancelConfirmPrompt(false)}
        onConfirm={async () => {
          await handleSubmitCancellation();
          setShowCancelConfirmPrompt(false);
        }}
        confirmLabel="Send request"
      />
    )}
    </>
  );
};

export default TripsClient;
