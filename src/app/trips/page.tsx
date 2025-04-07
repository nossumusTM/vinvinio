
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";

 "@/app/actions/getCurrentUser";
import getReservations from "@/app/actions/getReservations";

import { redirect } from "next/navigation";

import TripsClient from "./TripsClient";

const TripsPage = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/');
    }

    const reservations = await getReservations({ userId: currentUser.id });

    if (reservations.length === 0) {
        return (
            <ClientOnly>
                <EmptyState
                    title="No trips found"
                    subtitle="Looks like you havent reserved any trips."
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

export default TripsPage;