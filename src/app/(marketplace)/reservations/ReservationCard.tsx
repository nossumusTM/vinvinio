'use client';

import Image from "next/image";
import { MouseEvent, useCallback } from "react";
import { format } from 'date-fns';
import Avatar from "../components/Avatar";
import type { SafeReservation, SafeUser } from "@/app/(marketplace)/types";
import useMessenger from "@/app/(marketplace)/hooks/useMessager"; // keep name consistent
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import { TbCalendarTime, TbClock, TbUserSquareRounded } from "react-icons/tb";
import Button from "../components/Button";
// import { profilePathForUser } from "@/app/(marketplace)/utils/profilePath";
import { useRouter } from "next/navigation";
import formatReservationDateRange from "../utils/dateRange";

interface ReservationCardProps {
  reservation: SafeReservation;
  guestName: string;
  guestImage?: string;
  guestId?: string;
  currentUser?: SafeUser | null;
  onNavigate?: () => void;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation, currentUser, guestName, guestImage, guestId, onNavigate
}) => {
  const router = useRouter();
  const messenger = useMessenger();
  const { formatConverted } = useCurrencyFormatter();

  const u = reservation.user;

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const usernameLabel =
    (typeof u?.username === "string" && u.username.trim()) ||
    (guestName ?? "").trim() ||
    "User";

  const displayName = (guestName ?? u?.name ?? "").trim() || null;
  const uid = u?.id ?? guestId ?? null;

  const handle =
    (typeof u?.username === "string" && u.username.trim())
      ? u.username.trim()
      : (displayName ? slugify(displayName) : (uid ?? ""));

  const guestProfilePath =
    u?.role === "host"
      ? (handle ? `/provider/${encodeURIComponent(handle)}` : null)
      : (handle ? `/social-card/${encodeURIComponent(handle)}` : null);

  const handleGuestNavigation = useCallback(
    (event?: MouseEvent<HTMLElement>) => {
      if (!guestProfilePath) return;

      if (event?.button === 1) {
        event.preventDefault();
        window.open(guestProfilePath, "_blank", "noopener,noreferrer");
        return;
      }
      if (event?.metaKey || event?.ctrlKey) {
        window.open(guestProfilePath, "_blank", "noopener,noreferrer");
        return;
      }
      router.push(guestProfilePath);
    },
    [router, guestProfilePath]
  );

  const guestProfileButtonClasses =
    'group flex w-full items-center gap-3 rounded-full text-left outline-none transition focus-visible:ring-2 focus-visible:ring-black/40';

  // small helper for time rendering (guards against undefined)
  const renderTime = () => {
    const raw = reservation.time ?? '00:00';
    const [h, m] = raw.split(':').map(Number);
    const hour = Number.isFinite(h) ? h : 0;
    const minute = Number.isFinite(m) ? m : 0;
    const hour12 = (hour % 12) || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
  };

  const cancellationAttachments = Array.isArray(reservation.cancellationNoteAttachments)
    ? reservation.cancellationNoteAttachments.filter((item) => item && (item.data || item.url))
    : [];

  const hasCancellationNote = Boolean(reservation.cancellationNoteText?.trim()) || cancellationAttachments.length > 0;

  const cardIsInteractive = typeof onNavigate === 'function';

  return (
    <div
      role={cardIsInteractive ? 'button' : undefined}
      tabIndex={cardIsInteractive ? 0 : -1}
      onClick={() => cardIsInteractive && onNavigate?.()}
      onKeyDown={(event) => {
        if (!cardIsInteractive) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onNavigate?.();
        }
      }}
      className={`relative bg-white rounded-3xl shadow-md hover:shadow-lg transition duration-300 overflow-hidden ${
        cardIsInteractive ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-black' : ''
      }`}
      aria-label={cardIsInteractive ? `Open ${reservation.listing?.title ?? 'reservation'}` : undefined}
    >
      {Array.isArray(reservation.listing?.imageSrc) && reservation.listing.imageSrc.length > 0 && (
        <Image
          src={reservation.listing.imageSrc[0]}
          alt="Listing"
          className="w-full h-48 object-cover"
          width={500}
          height={500}
        />
      )}

      <div className="px-4 pt-2 pb-24 flex flex-col gap-2 text-black">
        <div className="pb-4 text-lg font-semibold">
          {reservation.listing?.title}
        </div>

        {/* Meta blocks */}
        <div className="pt-2 pb-2 w-full max-w-md p-4 rounded-xl md:mx-0 mx-auto">
          <div className="flex flex-col gap-0">
            {/* Guests */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                  <TbUserSquareRounded className="text-neutral-700 text-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">Guests</p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {reservation.guestCount}{' '}
                    <span className="font-normal text-neutral-700">
                      {reservation.guestCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                  <TbCalendarTime className="text-neutral-700 text-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">Date</p>
                  <p className="text-[15px] font-semibold text-neutral-900 break-words">
                    {/* {format(new Date(reservation.startDate), 'PPP')} */}
                    {formatReservationDateRange(reservation.startDate, reservation.endDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                  <TbClock className="text-neutral-700 text-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">Time</p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {renderTime()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="shadow-md shrink-0 h-9 w-9 rounded-xl flex items-center justify-center">
                  <span className="text-neutral-700 text-[18px] font-normal">€</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-wide text-neutral-500">Total</p>
                  <p className="text-[15px] font-semibold text-neutral-900">
                    {formatConverted(reservation.totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasCancellationNote && (
          <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <p className="font-semibold">Cancellation details</p>
            {reservation.cancellationNoteText ? (
              <p className="whitespace-pre-line text-rose-900">{reservation.cancellationNoteText}</p>
            ) : (
              <p className="text-rose-800">No note provided.</p>
            )}

            {cancellationAttachments.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Attachment</p>
                <div className="flex flex-wrap gap-3">
                  {cancellationAttachments.map((attachment, index) => {
                    const src = attachment.data || attachment.url;
                    const isImage = typeof src === 'string' && src.startsWith('data:image');

                    return (
                      <div
                        key={`cancellation-attachment-${index}`}
                        className="flex min-w-[160px] max-w-[220px] flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm ring-1 ring-rose-200"
                      >
                        {isImage && src ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-neutral-100 ring-1 ring-neutral-200">
                            <Image
                              src={src}
                              alt={attachment.name || 'Attachment preview'}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200">
                            <span className="text-sm">📎</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate">{attachment.name || 'Attachment'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booked by */}
        <div className="w-full rounded-2xl bg-white/90 backdrop-blur-md px-8 py-2.5">
          {guestProfilePath ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleGuestNavigation(event);
              }}
              onAuxClick={(event) => {
                event.stopPropagation();
                handleGuestNavigation(event);
              }}
              className={guestProfileButtonClasses}
              title="Open guest profile"
            >
              <span className="shrink-0 rounded-full bg-white/80 p-0.5">
                <Avatar src={guestImage} name={guestName} size={36} />
              </span>
              <span className="min-w-0">
                <span className="block text-[8px] uppercase tracking-wide text-neutral-500 leading-none">
                  Booked by
                </span>
                <span className="truncate text-[15px] font-semibold text-neutral-900 leading-tight group-hover:border-b border-neutral-800 transition group-focus-visible:border-b">
                  {usernameLabel}
                </span>
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="shrink-0 rounded-full">
                <Avatar src={guestImage} name={guestName} size={36} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] uppercase tracking-wide text-neutral-500 leading-none">Booked by</p>
                <span className="text-[15px] font-semibold text-neutral-900 truncate leading-tight">
                  {guestName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Guest mode info */}
        {guestName === 'Guest' && (
          <div className="flex flex-col items-center justify-center text-center gap-1 mt-2 text-xs text-neutral-600">
            Booked using guest mode
            {reservation.guestContact ? (
              <>
                {', contact: '}
                <span className="inline-block bg-green-100 text-green-700 w-fit font-semibold px-2 py-0.5 rounded">
                  {reservation.guestContact}
                </span>
              </>
            ) : (
              '.'
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mt-auto flex px-6 justify-center mb-7">
          <Button
            label="Send a Message"
            onClick={(event) => {
              event.stopPropagation();
              if (currentUser?.id === guestId) return;
              messenger.openChat({
                id: guestId || '',
                name: guestName,
                image: guestImage || undefined,
              });
            }}
            disabled={currentUser?.id === guestId}
            outline
            small
          />
        </div>
        <hr />
      </div>
    </div>
  );
};

export default ReservationCard;