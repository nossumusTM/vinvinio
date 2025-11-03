import { SafeListing, SafeUser } from "@/app/types";

import Heading from "@/app/components/Heading";
import Container from "@/app/components/Container";
import ListingCard from "@/app/components/listings/ListingCard";

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
            <div className="space-y-6">
                <Heading
                    title="Bookmarks"
                    subtitle="Experiences You've Saved"
                />
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