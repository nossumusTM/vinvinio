'use client';

import { toast } from "react-hot-toast";
export const dynamic = 'force-dynamic';
import axios from "axios";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Range, RangeKeyDict } from 'react-date-range';

import { SafeReservation, SafeUser } from "@/app/(marketplace)/types"
    ;
import Heading from "@/app/(marketplace)/components/Heading";
import Container from "@/app/(marketplace)/components/Container";
import ListingCard from "@/app/(marketplace)/components/listings/ListingCard";
import ReservationCard from "./ReservationCard";

import ConfirmPopup from "../components/ConfirmPopup";
import FilterReservations from "./FilterReservations";

const createDefaultRange = (): Range => ({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
});

interface ReservationsClientProps {
    reservations: SafeReservation[],
    currentUser?: SafeUser | null,
}

const ReservationsClient: React.FC<ReservationsClientProps> = ({
    reservations,
    currentUser
}) => {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingCancel, setPendingCancel] = useState<{
    id: string;
    guestEmail: string;
    listingId: string;
    } | null>(null);

    const [loadedReservations, setLoadedReservations] = useState(reservations);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(reservations.length === 4);
    
    const [filterKeyword, setFilterKeyword] = useState<string | null>(null);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [filteredReservations, setFilteredReservations] = useState<SafeReservation[] | null>(null);
    const [dateRange, setDateRange] = useState<Range>(() => createDefaultRange());
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedTime, setSelectedTime] = useState('12:00');
    const yearOptions = useMemo(() => {
        const baseYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, index) => baseYear - 2 + index);
    }, []);

    const reservationsToRender =
      (filterKeyword ? filteredReservations : loadedReservations) ?? [];
    const [navigationPrompt, setNavigationPrompt] = useState<{ path: string; title: string } | null>(null);

    const onCancel = useCallback((id: string, guestEmail: string, listingId: string) => {
        setPendingCancel({ id, guestEmail, listingId });
        setShowConfirm(true);
    }, []);

    const loadMoreReservations = useCallback(async () => {
        setLoadingMore(true);
        try {
          const res = await axios.get(`/api/reservations/load?skip=${page * 4}&take=4`);
          const newReservations = res.data || [];
          setPage((prev) => prev + 1);
          if (newReservations.length < 4) setHasMore(false); // 👈 Stop when fewer than 4
        } catch (err) {
          toast.error("Failed to load more reservations.");
        } finally {
          setLoadingMore(false);
        }
      }, [page]);

      const handleDateRangeChange = useCallback((value: RangeKeyDict) => {
        const selection = value.selection;
        if (!selection) return;
        setDateRange((previous) => ({
            startDate: selection.startDate ?? previous.startDate ?? new Date(),
            endDate: selection.endDate ?? selection.startDate ?? previous.endDate ?? new Date(),
            key: 'selection',
        }));
    }, []);

    const applyReservationFilter = useCallback(async () => {
        setIsFilterLoading(true);
        try {
            const response = await axios.post('/api/reservations/filter', {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                time: selectedTime || null,
                year: selectedYear,
            });
            setFilteredReservations(response.data);
            setFilterKeyword('reservations');
        } catch (error) {
            console.error(error);
            toast.error('Unable to filter reservations right now.');
        } finally {
            setIsFilterLoading(false);
        }
    }, [dateRange, selectedTime, selectedYear]);

    const resetReservationFilter = useCallback(() => {
        setIsFilterLoading(true);
        setFilterKeyword(null);
        setFilteredReservations(null);
        setSelectedTime('12:00');
        setSelectedYear(currentYear);
        setDateRange(createDefaultRange());
        setTimeout(() => setIsFilterLoading(false), 200);
    }, [currentYear]);

    const handleNavigationPrompt = useCallback((path: string | null, title: string) => {
        if (!path) return;
        setNavigationPrompt({ path, title });
    }, []);

    const confirmNavigation = useCallback(() => {
        if (!navigationPrompt) return;
        router.push(navigationPrompt.path);
        setNavigationPrompt(null);
    }, [navigationPrompt, router]);

    const cancelNavigation = useCallback(() => setNavigationPrompt(null), []);

      const handleKeywordFilter = useCallback((keyword: string) => {
        setIsFilterLoading(true);
        setFilterKeyword(keyword);
        setTimeout(() => setIsFilterLoading(false), 250);
    }, []);

    const resetKeywordFilter = useCallback(() => {
        setIsFilterLoading(true);
        setFilterKeyword(null);
        setTimeout(() => setIsFilterLoading(false), 200);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
          const { scrollTop } = document.documentElement;
          if (scrollTop < 100 && hasMore && !loadingMore) {
            loadMoreReservations();
          }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
      }, [hasMore, loadingMore, loadMoreReservations]);

      const showLoadMore = hasMore && !filteredReservations;

      return (
          <Container className="py-10">
              <div className="pageadjust px-5 space-y-6">
                  <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 shadow-md p-6">
                      <Heading
                          title="Booking Inbox"
                          subtitle="Who said ' YesSsSs! ' to your experience"
                      />
                      <FilterReservations
                          activeKeyword={filterKeyword}
                          isLoading={isFilterLoading}
                          range={dateRange}
                          timeValue={selectedTime}
                          selectedYear={selectedYear}
                          yearOptions={yearOptions}
                          onDateChange={handleDateRangeChange}
                          onTimeChange={setSelectedTime}
                          onYearChange={setSelectedYear}
                          onFilter={applyReservationFilter}
                          onReset={resetReservationFilter}
                      />
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                      {reservationsToRender.length === 0 ? (
                          <div className="col-span-full rounded-3xl border border-dashed border-neutral-200 bg-white/70 p-10 text-center shadow-sm">
                              <p className="text-base font-semibold text-neutral-900">No reservations found for this filter.</p>
                              <p className="text-sm text-neutral-600 mt-2">Reset the filter to see every booking.</p>
                          </div>
                      ) : 
                      reservationsToRender.map((reservation: any) => (
                          <div key={reservation.id} className="relative">
                          {reservation.status === 'cancelled' ? (
                              <div className="absolute top-4 left-4 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold uppercase rounded-md z-10">
                              Cancelled
                              </div>
                          ) : (
                              <div className="absolute top-4 left-4 px-2 py-1 bg-green-100 text-green-600 text-xs font-semibold uppercase rounded-md z-10">
                              Confirmed
                              </div>
                          )}

                          <ReservationCard
                               reservation={reservation}
                               guestName={reservation.user?.name || 'Guest'}
                               guestImage={reservation.user?.image}
                               guestId={reservation.user?.id}
                               currentUser={currentUser}
                               onNavigate={() => {
                                   const listingPath = reservation.listing?.slug
                                       ? `/listings/${reservation.listing.slug}`
                                       : (reservation.listing?.id ? `/listings/${reservation.listing.id}` : null);
                                   handleNavigationPrompt(listingPath, reservation.listing?.title || 'this listing');
                               }}
                          />
                          </div>

                      ))}
                    </div>
                </div>

                {showLoadMore && (
                  <div className="flex justify-center mt-20">
                      <button
                      onClick={loadMoreReservations}
                      disabled={loadingMore}
                      className="px-6 py-2 rounded-full bg-black text-white hover:bg-neutral-800 transition text-sm"
                      >
                      {loadingMore ? (
                          <div className="loader inline-block w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mt-1"></div>
                      ) : (
                          "Load More"
                      )}
                      </button>
                  </div>
                )}

            {navigationPrompt && (
                <ConfirmPopup
                    title="Leave this page?"
                    message={`You're about to open ${navigationPrompt.title || 'this listing'}. Continue?`}
                    onCancel={cancelNavigation}
                    onConfirm={() => {
                        confirmNavigation();
                    }}
                    confirmLabel="Open listing"
                />
            )}

            {showConfirm && pendingCancel && (
                <ConfirmPopup
                    title="Are you sure?"
                    message={
                    <>
                        This action will cancel the reservation. The guest will be notified by email.
                    </>
                    }
                    onCancel={() => {
                    setShowConfirm(false);
                    setPendingCancel(null);
                    }}
                    onConfirm={async () => {
                    setDeletingId(pendingCancel.id);
                    setShowConfirm(false);

                    try {
                        // 1️⃣ Send cancellation email
                        await axios.post("/api/email/cancel-reservation", {
                        guestEmail: pendingCancel.guestEmail,
                        listingId: pendingCancel.listingId,
                        });

                        // 2️⃣ Delete reservation
                        await axios.delete(`/api/reservations/${pendingCancel.id}`);

                        toast.success("Reservation cancelled!", {
                        iconTheme: {
                            primary: "#2200ffff",
                            secondary: "#fff",
                        },
                        });
                        router.refresh();
                    } catch (error) {
                        console.error("Cancel error:", error);
                        toast.error("Something went wrong.");
                    } finally {
                        setDeletingId("");
                        setPendingCancel(null);
                    }
                    }}
                    confirmLabel="Confirm"
                    cancelLabel="Cancel"
                />
                )}
        </Container>
    );
}

export default ReservationsClient;