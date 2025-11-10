'use client';

import { toast } from "react-hot-toast";
import axios from "axios";
import { MouseEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';
import Button from "../components/Button";

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

import { AxiosError } from 'axios';

import Image from "next/image";

interface TripsClientProps {
  reservations: SafeReservation[];
  currentUser?: SafeUser | null;
}

const TripsClient: React.FC<TripsClientProps> = ({
  reservations,
  currentUser,
}) => {
  const router = useRouter();
  const { formatConverted } = useCurrencyFormatter();
  const [deletingId, setDeletingId] = useState('');
  const [hostImages, setHostImages] = useState<Record<string, string>>({});
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [reviewInputs, setReviewInputs] = useState<Record<string, { rating: number; comment: string; hoverRating?: number }>>({});
  const [submittedReviews, setSubmittedReviews] = useState<Record<string, { rating: number; comment: string }>>({});

  const [loadedReservations, setLoadedReservations] = useState(reservations);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(reservations.length === 4);


  const messenger = useMessenger();

  const profileButtonClasses =
    'group flex w-full items-center gap-3 rounded-full text-left outline-none transition focus-visible:ring-2 focus-visible:ring-black/40';

  const makeNavigationHandler = useCallback(
    (path: string | null | undefined) =>
      (event?: MouseEvent<HTMLElement>) => {
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
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
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

  const handleSubmitCancellation = async () => {
    if (!selectedReservationId || !cancelReason) return;
  
    const reasonToSend = cancelReason === 'Other' ? customReason : cancelReason;
    const reservation = reservations.find(r => r.id === selectedReservationId);
    const formattedDate = format(new Date(reservation?.startDate || ''), 'PPP');
  
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
    - Guest Count: ${reservation?.guestCount}
    - Price: ${formatConverted(reservation?.totalPrice ?? 0)}
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
        }
      });
      setShowCancelModal(false);
      setSelectedReservationId(null);
    } catch (err) {
      toast.error('Failed to send cancellation email.');
    }
  };  

  const openCancelModal = useCallback((id: string) => {
    setSelectedReservationId(id);
    setShowCancelModal(true);
  }, []);  
  
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

  const handleReviewSubmit = async (reservationId: string, listingId: string) => {
    const { rating, comment } = reviewInputs[reservationId] || {};
  
    if (!rating || !comment) {
      setPopupMessage("Please provide a rating and a comment.");
      return;
    }
  
    try {
      await axios.post('/api/reviews', {
        reservationId,
        listingId,
        rating,
        comment,
      });
  
      toast.success('Review submitted!', {
        iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
        },
      });

      setSubmittedReviews((prev) => ({
        ...prev,
        [reservationId]: { rating, comment },
      }));
      
      router.refresh();
    } catch (error) {
      setPopupMessage("Failed to submit review.");
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      const reviews: Record<string, { rating: number; comment: string }> = {};
  
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
      if (newData.length === 4) setHasMore(false);
    } catch (err) {
      toast.error("Failed to load more reservations.");
    } finally {
      setLoadingMore(false);
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 50 && hasMore && !loadingMore) {
        loadMoreReservations();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, loadMoreReservations]);

    return (
      <>
      <Container className="py-10">
      <div className="pageadjust px-5 space-y-6">
      <Heading
        title="Activities"
        subtitle="Tracing your steps — behind and ahead"
      />
      <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
        {loadedReservations.map((reservation) => {

          const host = reservation.listing?.user;
          const hostNameClean = host?.username?.trim() || null;
          const hostName = hostNameClean ?? 'Unknown';
          const hostImage = host?.image ?? '';
          const hostId = host?.id ?? null;

          // prefer @username; otherwise slugify name; finally fall back to id
          const slugify = (s: string) =>
            s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

          const handle =
            (typeof host?.username === 'string' && host.username.trim())
              ? host.username.trim()
              : (hostNameClean ? slugify(hostNameClean) : (hostId ?? ''));

          const hostProfilePath =
            host?.role === 'host'
              ? (handle ? `/hosts/${encodeURIComponent(handle)}` : null)
              : (handle ? `/social-card/${encodeURIComponent(handle)}` : null);

          const handleHostNavigation = makeNavigationHandler(hostProfilePath);

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
                <Image
                  src={reservation.listing.imageSrc[0]}
                  alt="Listing"
                  className="w-full h-48 object-cover"
                  width={500}
                  height={500}
                />
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

                <div className="p-4 text-lg font-semibold">{reservation.listing.title}</div>
                

              {/* Reservation Meta — stacked, left-aligned (same as ReservationCard) */}
              <div className="pt-2 pb-4 w-full max-w-md p-4 rounded-xl md:mx-0 mx-auto">
                <div className="flex flex-col gap-3">

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
                          {format(new Date(reservation.startDate), 'PPP')}
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
                      onClick={handleHostNavigation}
                      onAuxClick={handleHostNavigation}
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
                <div className="mt-auto pt-4">
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
                        onClick={() => openCancelModal(reservation.id)}
                        disabled={deletingId === reservation.id}
                        className="text-sm font-medium text-neutral-700 hover:underline hover:text-black transition disabled:opacity-50"
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
                                  ...prev[reservation.id],
                                  hoverRating: star,
                                },
                              }))
                            }
                            onMouseLeave={() =>
                              setReviewInputs((prev) => ({
                                ...prev,
                                [reservation.id]: {
                                  ...prev[reservation.id],
                                  hoverRating: 0,
                                },
                              }))
                            }
                            onClick={() =>
                              setReviewInputs((prev) => ({
                                ...prev,
                                [reservation.id]: {
                                  ...prev[reservation.id],
                                  rating: star,
                                },
                              }))
                            }
                            className={`cursor-pointer text-2xl transition-colors ${
                              star <= (reviewInputs[reservation.id]?.hoverRating || reviewInputs[reservation.id]?.rating)
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
                          value={reviewInputs[reservation.id]?.comment || ''}
                          onChange={(e) =>
                            setReviewInputs((prev) => ({
                              ...prev,
                              [reservation.id]: {
                                ...prev[reservation.id],
                                comment: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      <button
                        onClick={() => handleReviewSubmit(reservation.id, reservation.listing.id)}
                        className="px-4 py-2 mb-4 bg-black text-white text-sm rounded-xl hover:bg-neutral-800"
                      >
                        Submit Review
                      </button>
                    </>
                  )}
                </div>
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
            </div>
          );
        })}

        {showCancelModal && (
          <Modal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onSubmit={handleSubmitCancellation}
            title="Cancel Reservation"
            actionLabel="Send Request"
            className="max-h-[60vh]"
            body={
              <div className="flex flex-col gap-4">
                {/* Heading */}
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-black">What Happened?</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Sharing your reason helps us improve.
                    <br />
                    <span className="text-xs text-neutral-500">
                      *Note: You can review our{" "}
                      <button
                        type="button"
                        onClick={() => {
                          const footer = document.getElementById('vuoiaggio-footer');
                          if (footer) {
                            footer.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="underline hover:text-black"
                      >
                        cancellation policy
                      </button>{" "}
                      for more details.
                    </span>
                  </p>
                </div>
            
                {/* Options */}
                <div className="flex flex-col gap-2">
                  {cancelOptions.map(option => (
                    <label
                      key={option}
                      className={`
                        flex items-center shadow-md rounded-lg px-8 py-4 text-md cursor-pointer transition 
                        ${cancelReason === option ? 'shadow-md bg-neutral-100' : 'hover:bg-neutral-100'}
                      `}
                    >
                      <input
                        type="radio"
                        name="cancel-reason"
                        value={option}
                        checked={cancelReason === option}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="mr-3 accent-black"
                      />
                      {option}
                    </label>
                  ))}
                </div>
            
                {/* Textarea for 'Other' */}
                {cancelReason === 'Other' && (
                  <div>
                    <textarea
                      placeholder="Please specify your reason"
                      className="w-full border border-neutral-300 rounded-lg p-3 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-black"
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
      </div>
      </div>

      {hasMore && (
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

    </Container>
    <div>
      {/* {currentUser?.role === 'moder' && (
          <div className="mt-10 max-w-md mx-auto bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-md font-semibold mb-2">Moderator Cancellation Tool</h3>
            <input
              type="text"
              placeholder="Enter Reservation ID"
              value={selectedReservationId || ''}
              onChange={(e) => setSelectedReservationId(e.target.value)}
              className="w-full border p-2 mb-2 rounded-md"
            />
            <button
              onClick={() => onCancel(selectedReservationId || '')}
              className="w-full bg-black text-white py-2 rounded-md hover:bg-neutral-800"
            >
              Cancel Reservation
            </button>
          </div>
        )} */}
      </div>
    </>
  );
};

export default TripsClient;
