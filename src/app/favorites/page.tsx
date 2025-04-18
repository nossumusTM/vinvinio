
import EmptyState from "@/app/components/EmptyState";
import ClientOnly from "@/app/components/ClientOnly";
import getCurrentUser from "../actions/getCurrentUser";
import getFavoriteListings from "@/app/actions/getFavoriteListings";

import FavoritesClient from "./FavoritesClient";

const ListingPage = async () => {
    const listings = await getFavoriteListings();
    const currentUser = await getCurrentUser();

    if (listings.length === 0) {
        return (
            <ClientOnly>
                <div className="flex flex-col justify-center items-center">
                    <EmptyState
                    title="Nothing Saved Yet"
                    subtitle="Browse the collection and find your favorites."
                    />
                    <a
                    href="/"
                    className="ml-4 px-4 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 transition"
                    >
                    Browse Collection
                </a>
                </div>
            </ClientOnly>
        );
    }

    return (
        <ClientOnly>
            <FavoritesClient
                listings={listings}
                currentUser={currentUser}
            />
        </ClientOnly>
    );
}

export default ListingPage;