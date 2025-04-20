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
        <Container>
            <div className="pl-4 pt-4 md:pt-6">
            <Heading
                title="To-Do"
                subtitle="Moments You've Bookmarked"
            />
            </div>
            <div
                className="
          mt-10
          grid-cols-1 
          grid 
          md:grid-cols-2 
          sm:grid-cols-1 
          2xl:grid-cols-4
          xl:grid-cols-2
          max-w-screen-2xl
          gap-12
          mx-auto
          "
            >
                {listings.map((listing: any) => (
                    <ListingCard
                        currentUser={currentUser}
                        key={listing.id}
                        data={listing}
                    />
                ))}
            </div>
        </Container>
    );
}

export default FavoritesClient;