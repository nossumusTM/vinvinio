// pages/page.tsx (Home with Load More)
'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import Container from "@/app/components/Container";
import ListingCard from "@/app/components/listings/ListingCard";
import EmptyState from "@/app/components/EmptyState";
import ListingFilter, { GridSize } from "@/app/components/listings/ListingFilter";
import ClientOnly from "@/app/components/ClientOnly";
import { useSearchParams } from 'next/navigation';
import axios from "axios";
import { SafeUser } from "@/app/types";
import toast from "react-hot-toast";
import qs from 'query-string';
import ListingCardSkeleton from "@/app/components/listings/ListingCardSkeleton";

interface HomeProps {
  initialListings: any[];
  currentUser: SafeUser | null;
}

const INITIAL_SKELETON_COUNT = 12;
const LOAD_MORE_SKELETON_COUNT = 4;

const HomeClient: React.FC<HomeProps> = ({ initialListings, currentUser }) => {
  const [listings, setListings] = useState<any[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialListings.length === 12);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const searchParams = useSearchParams();

  const rawQuery = useMemo(() => {
    if (!searchParams) {
      return {} as Record<string, string>;
    }

    return Object.fromEntries(searchParams.entries());
  }, [searchParams]);

  const filterQuery = useMemo(
    () =>
      qs.stringify(rawQuery, {
        skipNull: true,
        skipEmptyString: true,
      }),
    [rawQuery]
  );

  const hasActiveFilters = useMemo(() => filterQuery.length > 0, [filterQuery]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setListings(initialListings);
      setPage(1);
      setHasMore(initialListings.length === 12);
      setIsFiltering(false);
      return;
    }

    let isSubscribed = true;

    const fetchFilteredListings = async () => {
      setIsFiltering(true);
      setListings(null);

      try {
        const res = await axios.get(`/api/listings?${filterQuery}`);
        if (!isSubscribed) {
          return;
        }

        setListings(res.data);
        setPage(1);
        setHasMore(res.data.length === 12);
      } catch (err) {
        if (isSubscribed) {
          toast.error('Failed to fetch filtered listings.');
        }
      } finally {
        if (isSubscribed) {
          setIsFiltering(false);
        }
      }
    };

    fetchFilteredListings();

    return () => {
      isSubscribed = false;
    };
  }, [filterQuery, hasActiveFilters, initialListings]);

  const loadMoreListings = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const query = qs.stringify(
      {
        ...rawQuery,
        skip: page * 12,
        take: 12,
      },
      { skipNull: true, skipEmptyString: true }
    );

    try {
      const res = await axios.get(`/api/listings/load?${query}`);
      const newListings = res.data;
      setListings((prev) => [...(prev || []), ...newListings]);
      setPage((prev) => prev + 1);
      if (newListings.length < 12) setHasMore(false);
    } catch (err) {
      toast.error("Failed to load more listings.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGridChange = useCallback((size: GridSize) => {
    setGridSize(size);
  }, []);

  const gridColumnsClass = useMemo(() => {
    switch (gridSize) {
      case 2:
        return "md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2";
      case 6:
        return "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6";
      case 4:
      default:
        return "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";
    }
  }, [gridSize]);

  const gridBaseClasses = "pt-28 md:pt-32 grid grid-cols-1 sm:grid-cols-1 gap-12 max-w-screen-2xl mx-auto relative z-10";

  if (!listings && !isFiltering) {
    return (
      <ClientOnly>
        <Container>
          <div className="relative z-30">
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999]">
              <ListingFilter gridSize={gridSize} onGridChange={handleGridChange} />
            </div>

            <div className={`${gridBaseClasses} ${gridColumnsClass}`}>
              {Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, index) => (
                <ListingCardSkeleton key={`initial-skeleton-${index}`} />
              ))}
            </div>
          </div>
        </Container>
      </ClientOnly>
    );
  }

  if (listings && listings.length === 0) return <EmptyState showReset />;

  return (
    <ClientOnly>
      <Container>
        <div className="relative z-30">
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999]">
            <ListingFilter gridSize={gridSize} onGridChange={handleGridChange} />
          </div>

          <div className={`${gridBaseClasses} ${gridColumnsClass}`}>
            {listings ? (
              <>
                {listings.map((listing: any) => (
                  <ListingCard key={listing.id} data={listing} currentUser={currentUser} />
                ))}
                {loadingMore &&
                  Array.from({ length: LOAD_MORE_SKELETON_COUNT }).map((_, index) => (
                    <ListingCardSkeleton key={`load-skeleton-${index}`} />
                  ))}
              </>
            ) : (
              Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, index) => (
                <ListingCardSkeleton key={`filter-skeleton-${index}`} />
              ))
            )}
          </div>

          {listings && hasMore && !isFiltering && (
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
