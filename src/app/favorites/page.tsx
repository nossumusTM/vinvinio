
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
                    title="No favorites found"
                    subtitle="Looks like you have no favorite listings."
                    />
                    
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