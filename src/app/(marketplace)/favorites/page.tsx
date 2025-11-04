
import EmptyStateFavorites from "@/app/(marketplace)/components/EmptyStateFavorites";
import ClientOnly from "@/app/(marketplace)/components/ClientOnly";
import getCurrentUser from "../actions/getCurrentUser";
import getFavoriteListings from "@/app/(marketplace)/actions/getFavoriteListings";
import getListings from "@/app/(marketplace)/actions/getListings";
import ListingSlider from "../components/listings/ListingSlider";

import FavoritesClient from "./FavoritesClient";

const ListingPage = async () => {
    const listings = await getFavoriteListings();
    const currentUser = await getCurrentUser();

    if (listings.length === 0) {
        const all = await getListings({});
        const randomListings = all.sort(() => 0.5 - Math.random()).slice(0, 10);
        return (
            <ClientOnly>
                <div className="flex flex-col justify-center items-center">
                    <EmptyStateFavorites
                    title="Wishlist currently empty"
                    subtitle="Navigate and keep inspiring experiences"
                    />
                    <a
                    href="/"
                    className="md:ml-2 px-4 py-2 font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition mb-8 md:mb-0"
                    >
                    Explore the Moment..
                </a>
                </div>
                <div className="md:pt-20">
                {/* 👇 Render vertical scrollable slider */}
                <ListingSlider listings={randomListings} currentUser={currentUser} />
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