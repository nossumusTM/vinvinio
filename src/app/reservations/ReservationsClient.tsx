'use client';

import { toast } from "react-hot-toast";
export const dynamic = 'force-dynamic';
import axios from "axios";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { SafeReservation, SafeUser } from "@/app/types"
    ;
import Heading from "@/app/components/Heading";
import Container from "@/app/components/Container";
import ListingCard from "@/app/components/listings/ListingCard";
import ReservationCard from "./ReservationCard";

import ConfirmPopup from "../components/ConfirmPopup";

interface ReservationsClientProps {
    reservations: SafeReservation[],
    currentUser?: SafeUser | null,
}

const ReservationsClient: React.FC<ReservationsClientProps> = ({
    reservations,
    currentUser
}) => {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingCancel, setPendingCancel] = useState<{
    id: string;
    guestEmail: string;
    listingId: string;
    } | null>(null);

    const [loadedReservations, setLoadedReservations] = useState(reservations);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(reservations.length === 4);

    const onCancel = useCallback((id: string, guestEmail: string, listingId: string) => {
        setPendingCancel({ id, guestEmail, listingId });
        setShowConfirm(true);
    }, []);

    const loadMoreReservations = async () => {
        setLoadingMore(true);
        try {
          const res = await axios.get(`/api/reservations/load?skip=${page * 4}&take=4`); // 👈 Fetch 4
          const newReservations = res.data || [];
          setLoadedReservations((prev) => [...prev, ...newReservations]);
          setPage((prev) => prev + 1);
          if (newReservations.length < 4) setHasMore(false); // 👈 Stop when fewer than 4
        } catch (err) {
          toast.error("Failed to load more reservations.");
        } finally {
          setLoadingMore(false);
        }
      };      

    useEffect(() => {
        const handleScroll = () => {
          const { scrollTop } = document.documentElement;
          if (scrollTop < 100 && hasMore && !loadingMore) {
            loadMoreReservations();
          }
        };
      
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
      }, [hasMore, loadingMore]);      

    return (
        <Container>
            <div className="mb-8 pl-4 pt-4 md:pt-6">
                <Heading
                    title="Booking Inbox"
                    subtitle="Who said ' YesSsSs! ' to your experience"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10 mt-10">
                {loadedReservations.map((reservation: any) => (
                    <div key={reservation.id} className="relative">
                    {reservation.status === 'cancelled' ? (
                        <div className="absolute top-4 left-4 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold uppercase rounded-md z-10">
                        Cancelled
                        </div>
                    ) : (
                        <div className="absolute top-4 left-4 px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold uppercase rounded-md z-10">
                        Confirmed
                        </div>
                    )}

                    <ReservationCard
                         reservation={reservation}
                         guestName={reservation.user?.name || 'Guest'}
                         guestImage={reservation.user?.image}
                         guestId={reservation.user?.id}
                         currentUser={currentUser}
                    />
                    </div>

                ))}
            </div>

            {hasMore && (
            <div className="flex justify-center mt-20">
                <button
                onClick={loadMoreReservations}
                disabled={loadingMore}
                className="px-6 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition text-sm"
                >
                {loadingMore ? (
                    <div className="loader inline-block w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mt-1"></div>
                ) : (
                    "Load More"
                )}
                </button>
            </div>
            )}

            {showConfirm && pendingCancel && (
                <ConfirmPopup
                    title="Are you sure?"
                    message={
                    <>
                        This action will cancel the reservation. The guest will be notified by email.
                    </>
                    }
                    onCancel={() => {
                    setShowConfirm(false);
                    setPendingCancel(null);
                    }}
                    onConfirm={async () => {
                    setDeletingId(pendingCancel.id);
                    setShowConfirm(false);

                    try {
                        // 1️⃣ Send cancellation email
                        await axios.post("/api/email/cancel-reservation", {
                        guestEmail: pendingCancel.guestEmail,
                        listingId: pendingCancel.listingId,
                        });

                        // 2️⃣ Delete reservation
                        await axios.delete(`/api/reservations/${pendingCancel.id}`);

                        toast.success("Reservation cancelled!", {
                        iconTheme: {
                            primary: "#00b8ff",
                            secondary: "#fff",
                        },
                        });
                        router.refresh();
                    } catch (error) {
                        console.error("Cancel error:", error);
                        toast.error("Something went wrong.");
                    } finally {
                        setDeletingId("");
                        setPendingCancel(null);
                    }
                    }}
                    confirmLabel="Confirm"
                    cancelLabel="Cancel"
                />
                )}
        </Container>
    );
}

export default ReservationsClient;