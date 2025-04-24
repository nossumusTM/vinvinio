'use client';

import { toast } from "react-hot-toast";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';

import { SafeReservation, SafeUser } from "@/app/types";
import { TbCalendarTime, TbUserScan, TbClock, TbUserSquareRounded, TbMessageDots } from "react-icons/tb";
import useMessenger from "@/app/hooks/useMessager";

import Heading from "@/app/components/Heading";
import Container from "@/app/components/Container";
import Avatar from "@/app/components/Avatar";
import ConfirmPopup from "../components/ConfirmPopup";
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
    - Price: €${reservation?.totalPrice}
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
          primary: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)',
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
            primary: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)',
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

  const loadMoreReservations = async () => {
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
  };  
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 50 && hasMore && !loadingMore) {
        loadMoreReservations();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore]);

  return (
    <>
    <Container>
      <div className="pl-4 pt-4 md:pt-6">
      <Heading
        title="Booked Voyages"
        subtitle="Tracing your steps — behind and ahead"
      />
      </div>
      <div className="
        mt-10
        grid 
        grid-cols-1 
        sm:grid-cols-1 
        md:grid-cols-2 
        xl:grid-cols-2
        2xl:grid-cols-4
        gap-12
        max-w-screen-2xl
        mx-auto
      ">
        {loadedReservations.map((reservation) => {
          const host = reservation.listing?.user ?? {};
          const hostName = host?.name ?? 'Unknown';
          const hostImage = host?.image ?? '';         

          return (
            <div
              key={reservation.id}
              className="relative bg-white border border-neutral-200 rounded-3xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden"
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

              <div className="p-4 flex flex-col gap-2">
                <div className="text-lg font-semibold">{reservation.listing.title}</div>

                <div className="text-sm text-neutral-600 mt-4 flex flex-row gap-1 align-center justify-center">
                  <p className="text-md text-black">Guests:</p>
                  <div className="text-md font-bold">
                    {reservation.guestCount ?? 'N/A'}
                  </div>
                </div>

                <div className="flex flex-row gap-2 text-sm text-neutral-600 font-bold shadow-md mx-10 justify-center rounded-xl p-4">
                  {/* <div className="text-2xl"><TbCalendarTime /></div> */}
                  <div className="pt-0.5 flex flex-row gap-2 justify-center items-center">{format(new Date(reservation.startDate), 'PPP')}
                  <div className="">{reservation.time}{' '}
                    {(() => {
                      const hour = parseInt(reservation.time.split(':')[0], 10);
                      return hour >= 12 ? 'PM' : 'AM';
                    })()}</div>
                  </div>
                </div>

                {/* <div className="flex flex-row gap-2 text-lm text-neutral-600 font-bold">
                  <div className="text-2xl"><TbClock /></div>
                  <div className="pt-0.5">{reservation.time}{' '}
                {(() => {
                  const hour = parseInt(reservation.time.split(':')[0], 10);
                  return hour >= 12 ? 'PM' : 'AM';
                })()}</div>
                </div> */}


                <div className="flex flex-col items-center gap-2">
                  <p className="text-l font-bold text-neutral-600 pt-6">Guided by</p>
                  <Avatar src={hostImage} name={hostName} />
                  <span className="text-xl font-bold">{hostName}</span>
                  <button
                    onClick={() => {
                      if (currentUser?.id === host?.id) return;

                      const recipient = {
                        id: host?.id ?? '',
                        name: hostName,
                        image: hostImage ?? undefined,
                      };

                      messenger.openChat(recipient);
                    }}
                    className="text-sm text-neutral-700 hover:underline hover:text-black transition"
                  >
                    Message {hostName}
                  </button>
                </div>


                {new Date(reservation.startDate) > new Date(Date.now() + 24 * 60 * 60 * 1000) ? (
                  <button
                    onClick={() => openCancelModal(reservation.id)}
                    disabled={deletingId === reservation.id}
                    className="mt-4 text-sm font-medium text-neutral-700 hover:underline hover:text-black transition disabled:opacity-50"
                  >
                    Need to cancel for some reason?
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-neutral-500 px-10 text-center">
                    Cancellation is no longer possible. Please review our{' '}
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
                              star <= submittedReviews[reservation.id].rating ? 'text-black' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-700 italic px-2 mb-6">
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
                                ? 'text-black'
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
