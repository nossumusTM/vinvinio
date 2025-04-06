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

  const messenger = useMessenger();

  const onCancel = useCallback(
    (id: string) => {
      setDeletingId(id);

      axios
        .delete(`/api/reservations/${id}`)
        .then(() => {
          toast.success('Reservation cancelled');
          router.refresh();
        })
        .catch((error) => {
          toast.error(error?.response?.data?.error);
        })
        .finally(() => {
          setDeletingId('');
        });
    },
    [router]
  );

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
  
      setPopupMessage("Review submitted!");

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
        // try {
        //   const res = await fetch('/api/reviews/get-by-reservation', {
        //     method: 'POST',
        //     body: JSON.stringify({ reservationId: reservation.id }),
        //   });
  
        //   const data = await res.json();
  
        //   if (data) {
        //     reviews[reservation.id] = {
        //       rating: data.rating,
        //       comment: data.comment,
        //     };
        //   }
        // } catch (err) {
        //   console.warn(`Failed to fetch review for reservation ${reservation.id}`);
        // }
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

  return (
    <Container>
      <div className="pl-2">
      <Heading
        title="Trips"
        subtitle="Where you've been and where you're going"
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
        {reservations.map((reservation) => {
          const host = reservation.listing.user;
          const hostName = host?.name || 'Unknown';
          const hostImage = host?.image;          

          return (
            <div
              key={reservation.id}
              className="bg-white border border-neutral-200 rounded-2xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden"
            >
              {/* <Image
                src={reservation.listing.imageSrc}
                alt="Listing"
                className="w-full h-48 object-cover"
              /> */}
              {Array.isArray(reservation.listing.imageSrc) && reservation.listing.imageSrc.length > 0 && (
                <Image
                  src={reservation.listing.imageSrc[0]} // or pick randomly if preferred
                  alt="Listing"
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4 flex flex-col gap-2">
                <div className="text-lg font-semibold">{reservation.listing.title}</div>

                <div className="text-sm text-neutral-600 flex flex-row gap-1 align-center">
                  <p className="text-md text-black">Guests:</p>
                  <div className="text-md font-bold">
                    {reservation.guestCount ?? 'N/A'}
                  </div>
                </div>

                <div className="flex flex-row gap-2 text-sm text-neutral-600 font-bold bg-neutral-100 justify-center rounded-lg mt-4 p-4">
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
                    className="text-sm text-neutral-600 hover:underline hover:text-black transition"
                  >
                    Contact {hostName}
                  </button>
                </div>


                {new Date(reservation.startDate) > new Date(Date.now() + 24 * 60 * 60 * 1000) && (
                <button
                  onClick={() => onCancel(reservation.id)}
                  disabled={deletingId === reservation.id}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-black rounded-xl hover:bg-neutral-700 disabled:opacity-50"
                >
                  Cancel reservation
                </button>
              )}
              </div>

              {currentUser?.role === 'promoter' && (
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
      </div>
    </Container>
  );
};

export default TripsClient;
