
import EmptyState from "@/app/(marketplace)/components/EmptyState";
import ClientOnly from "@/app/(marketplace)/components/ClientOnly";
export const dynamic = 'force-dynamic';

import { redirect } from "next/navigation";

import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import getReservations from "@/app/(marketplace)/actions/getReservations";

import TripsClient from "./ReservationsClient";

const ReservationsPage = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
            redirect('/');
    }

    const reservations = await getReservations({ authorId: currentUser.id, skip: 0, take: 4 });

    if (reservations.length === 0) {
        return (
            <ClientOnly>
                <EmptyState
                    title="No reservations found"
                    subtitle="Looks like you have no reservations on your listings."
                />
            </ClientOnly>
        );
    }

    return (
        <ClientOnly>
            <TripsClient
                reservations={reservations}
                currentUser={currentUser}
            />
        </ClientOnly>
    );
}

export default ReservationsPage;