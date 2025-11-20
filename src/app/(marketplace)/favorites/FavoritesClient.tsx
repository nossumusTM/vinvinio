import { SafeListing, SafeUser } from "@/app/(marketplace)/types";

import Heading from "@/app/(marketplace)/components/Heading";
import Container from "@/app/(marketplace)/components/Container";
import ListingCard from "@/app/(marketplace)/components/listings/ListingCard";

interface FavoritesClientProps {
    listings: SafeListing[],
    currentUser?: SafeUser | null,
}

const FavoritesClient: React.FC<FavoritesClientProps> = ({
    listings,
    currentUser
}) => {
    return (
        <Container className="py-10">
            <div className="pageadjust px-5 space-y-6">
                <div className="mb-8 space-y-4 rounded-3xl border border-neutral-200 bg-white/90 shadow-md p-6">
                    <Heading
                        title="Bookmarks"
                        subtitle="Experiences You've Saved"
                    />
                    </div>
                <div
                    className="mt-6 grid grid-cols-1 gap-12 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4"
                >
                    {listings.map((listing: any) => (
                        <ListingCard
                            currentUser={currentUser}
                            key={listing.id}
                            data={listing}
                        />
                    ))}
                </div>
            </div>
        </Container>
    );
}

export default FavoritesClient;