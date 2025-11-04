
import EmptyStateFavorites from "@/app/(marketplace)/components/EmptyStateFavorites";
import ClientOnly from "@/app/(marketplace)/components/ClientOnly";

import getCurrentUser from "@/app/(marketplace)/actions/getCurrentUser";
import getReservations from "@/app/(marketplace)/actions/getReservations";
import getListings from "@/app/(marketplace)/actions/getListings";

import ListingSlider from "../components/listings/ListingSlider";

import { redirect } from "next/navigation";

import TripsClient from "./TripsClient";

const TripsPage = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/');
    }

    const reservations = await getReservations({ userId: currentUser.id });

    if (reservations.length === 0) {
        const all = await getListings({});
        const randomListings = all.sort(() => 0.5 - Math.random()).slice(0, 10);

        return (
            <ClientOnly>
                <div className="flex flex-col justify-center items-center">
                <EmptyStateFavorites
                    title="No appointments scheduled"
                    subtitle="Start exploring to create unforgettable memories"
                    />
                    <a
                        href="/"
                        className="md:ml-2 px-4 py-2 font-semibold bg-black text-white rounded-xl hover:bg-neutral-800 transition mb-8 md:mb-0"
                    >
                        Explore the Moment..
                    </a>
                </div>

                <div className="md:pt-20">
                    <ListingSlider listings={randomListings} currentUser={currentUser} />
                </div>
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