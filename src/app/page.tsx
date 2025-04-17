import Container from "@/app/components/Container";
import ListingCard from "@/app/components/listings/ListingCard";
import EmptyState from "@/app/components/EmptyState";
export const dynamic = 'force-dynamic';

import getListings, {
  IListingsParams
} from "@/app/actions/getListings";
import getCurrentUser from "@/app/actions/getCurrentUser";
import ClientOnly from "./components/ClientOnly";
import Footer from "./components/Footer";
import ListingFilter from "./components/listings/ListingFiltering";

interface HomeProps {
  searchParams: IListingsParams
};

const Home = async ({ searchParams }: HomeProps) => {
  const listings = await getListings(searchParams);
  const currentUser = await getCurrentUser();

  if (listings.length === 0) {
    return (
      <ClientOnly>
        <EmptyState showReset />
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <Container>
        {/* Wrap both filter and grid in a relative with z-context */}
        <div className="relative z-30 mt-2">
          {/* Filter dropdown centered */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999]">
            <ListingFilter />
          </div>

          {/* Listing grid */}
          <div
            className="
              pt-32
              grid 
              grid-cols-1 
              sm:grid-cols-1 
              md:grid-cols-2 
              xl:grid-cols-4
              2xl:grid-cols-4
              gap-12
              max-w-screen-2xl
              mx-auto
              relative
              z-10
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
        </div>
      </Container>

    </ClientOnly>
  )
}

export default Home;