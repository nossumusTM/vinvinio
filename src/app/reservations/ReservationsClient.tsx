'use client';

import { toast } from "react-hot-toast";
export const dynamic = 'force-dynamic';
import axios from "axios";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { SafeReservation, SafeUser } from "@/app/types"
    ;
import Heading from "@/app/components/Heading";
import Container from "@/app/components/Container";
import ListingCard from "@/app/components/listings/ListingCard";

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

    const onCancel = useCallback((id: string, guestEmail: string, listingId: string) => {
        setPendingCancel({ id, guestEmail, listingId });
        setShowConfirm(true);
    }, []);

    return (
        <Container>
            <div className="mb-8 pl-6">
                <Heading
                    title="Bookings"
                    subtitle="Bookings on your listings"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 mt-10">
                {reservations.map((reservation: any) => (
                    <ListingCard
                        key={reservation.id}
                        data={reservation.listing}
                        reservation={reservation}
                        actionId={reservation.id}
                        onAction={() =>
                            onCancel(
                              reservation.id,
                              reservation.user?.email || '',
                              reservation.listing?.id
                            )
                          }
                        disabled={deletingId === reservation.id}
                        actionLabel="Cancel guest reservation"
                        currentUser={currentUser}
                    />
                ))}
            </div>

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