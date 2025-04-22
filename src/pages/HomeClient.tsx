// pages/page.tsx (Home with Load More)
'use client';

import { useEffect, useState } from "react";
import Container from "@/app/components/Container";
import ListingCard from "@/app/components/listings/ListingCard";
import EmptyState from "@/app/components/EmptyState";
import ListingFilter from "@/app/components/listings/ListingFilter";
import ClientOnly from "@/app/components/ClientOnly";
import { useSearchParams } from 'next/navigation';
import Loader from "@/app/components/Loader";
import axios from "axios";
import { SafeUser } from "@/app/types";
import toast from "react-hot-toast";
import qs from 'query-string';

interface HomeProps {
  initialListings: any[];
  currentUser: SafeUser | null;
}

const HomeClient: React.FC<HomeProps> = ({ initialListings, currentUser }) => {
  // const [listings, setListings] = useState(initialListings);
  const [listings, setListings] = useState<any[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialListings.length === 12);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const searchParams = useSearchParams();

  // 👉 Filter support
  useEffect(() => {
    const fetchFilteredListings = async () => {
      setIsFiltering(true);

      const query = qs.stringify({
        ...Object.fromEntries(searchParams!.entries()),
      });

      try {
        const res = await axios.get(`/api/listings?${query}`);
        setListings(res.data);
        setPage(1);
        setHasMore(res.data.length === 12);
      } catch (err) {
        toast.error('Failed to fetch filtered listings.');
      } finally {
        setIsFiltering(false);
      }
    };

    fetchFilteredListings();
  }, [searchParams]);

  useEffect(() => {
    setListings(initialListings);
  }, [initialListings]);

  const loadMoreListings = async () => {
    if (loadingMore || !hasMore) return;
  
    setLoadingMore(true);
  
    const query = qs.stringify({
      ...Object.fromEntries(searchParams!.entries()),
      skip: page * 12,
      take: 12,
    }, { skipNull: true, skipEmptyString: true });
    
  
    try {
      const res = await axios.get(`/api/listings/load?${query}`);
      const newListings = res.data;
      // setListings((prev) => [...prev, ...newListings]);
      setListings((prev) => [...(prev || []), ...newListings]);
      setPage((prev) => prev + 1);
      if (newListings.length < 12) setHasMore(false);
    } catch (err) {
      toast.error("Failed to load more listings.");
    } finally {
      setLoadingMore(false);
    }
  };  

//   useEffect(() => {
//     const handleScroll = () => {
//       if (window.scrollY < 50 && hasMore && !loadingMore) {
//         loadMoreListings();
//       }
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, [hasMore, loadingMore]);

  // if (listings.length === 0) return <EmptyState showReset />;

  if (!listings) return <div className="pt-0"><Loader /></div>;
  if (listings.length === 0) return <EmptyState showReset />;

  return (
    <ClientOnly>
      <Container>
        <div className="relative z-30">
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999]">
            <ListingFilter />
          </div>

          <div className="pt-28 md:pt-32 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-12 max-w-screen-2xl mx-auto relative z-10">
            {listings.map((listing: any) => (
              <ListingCard key={listing.id} data={listing} currentUser={currentUser} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-20 md:mt-20">
                <button
                onClick={loadMoreListings}
                disabled={loadingMore}
                className="px-6 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition text-sm"
                >
                {loadingMore ? (
                    <div className="loader inline-block w-5 h-5 mt-1 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                ) : (
                    "Load More"
                )}
                </button>
            </div>
            )}
        </div>
      </Container>
    </ClientOnly>
  );
};

export default HomeClient;