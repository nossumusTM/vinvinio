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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 767px)');
    const update = () => {
      const mobile = mq ? mq.matches : window.innerWidth < 768;
      setIsMobile(mobile);

      // ⬅️ NEW: On mobile, default grid = 1 (unless already grid 2 selected)
      if (mobile && gridSize !== 2) {
        setGridSize(1);
      }

      // ⬅️ On desktop, return to normal default (only if user didn't pick something)
      if (!mobile && gridSize === 1) {
        setGridSize(4);
      }
    };

    update();
    mq?.addEventListener?.('change', update);
    window.addEventListener('resize', update);

    return () => {
      mq?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, [gridSize]);

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

  // compact = desktop 6× OR mobile grid 2
  const compact = useMemo(() => gridSize === 6 || (isMobile && gridSize === 2), [gridSize, isMobile]);

  const gapClass = useMemo(() => (compact ? "gap-6" : "gap-12"), [compact]);

  const handleGridChange = useCallback((size: GridSize) => {
    setGridSize(size);
  }, []);

  // const gapClass = useMemo(() => (gridSize === 6 ? "gap-6" : "gap-12"), [gridSize]);

  // 👇 add Grid 1 and tweak columns for mobile/desktop
  const gridColumnsClass = useMemo(() => {
    switch (gridSize) {
      case 1:
        // mobile 1 col; scale reasonably on larger screens
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";
      case 2:
        // mobile 2 cols, keep 2 cols up to xl for consistency
        return "grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2";
      case 6:
        // denser layout; mobile ignored because UI won’t offer 6 there
        return "grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
      case 4:
      default:
        return "grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";
    }
  }, [gridSize]);

  // drop sm:grid-cols-1 so mobile can show multiple columns
  const gridBaseClasses =
    "pt-28 md:pt-32 grid max-w-screen-2xl mx-auto relative z-10";

  if (!listings && !isFiltering) {
    return (
      <ClientOnly>
        <Container>
          <div className="relative z-30">
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-[9999]">
              <ListingFilter gridSize={gridSize} onGridChange={handleGridChange} />
            </div>

            <div className={`${gridBaseClasses} ${gapClass} ${gridColumnsClass}`}>
              {Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, i) => (
                <ListingCardSkeleton key={`initial-skeleton-${i}`} compact={compact} />
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

          <div className={`${gridBaseClasses} ${gapClass} ${gridColumnsClass}`}>
            {listings ? (
              <>
                {listings.map((listing: any) => (
                  <ListingCard
                    key={listing.id}
                    data={listing}
                    currentUser={currentUser}
                    compact={compact}  // 👈 pass compact
                  />
                ))}
                {loadingMore &&
                  Array.from({ length: LOAD_MORE_SKELETON_COUNT }).map((_, i) => (
                    <ListingCardSkeleton key={`load-skeleton-${i}`} compact={compact} />
                  ))}
              </>
            ) : (
              Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, i) => (
                <ListingCardSkeleton key={`filter-skeleton-${i}`} compact={compact} />
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
