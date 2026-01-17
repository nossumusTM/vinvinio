'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import clsx from 'clsx';

import type { SocialCardVisitedPlace } from '@/app/(marketplace)/types';
import useMessenger from '@/app/(marketplace)/hooks/useMessager';

import Heading from '../../components/Heading';
import VerificationBadge from '../../components/VerificationBadge';

export type BookingSummary = {
  id: string;
  listingTitle: string;
  listingHref: string;
  coverImage?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
};

export type ReviewSummary = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  listingTitle: string;
  listingHref: string;
};

export type PublicSocialCardProps = {
  user: {
    id: string;
    username: string | null;
    displayedName: string;
    image: string | null;
    profession: string | null;
    bio: string | null;
    email: string | null;
    phone: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    isSuspended: boolean;
  };
  visibility: Record<string, boolean>;
  visitedPlaces: SocialCardVisitedPlace[];
  contactDisplay: string[];
  hobbies: string[];
  bookings: BookingSummary[];
  reviews: ReviewSummary[];
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(value));
  } catch {
    return '—';
  }
};

const ratingLabel = (rating: number) => `${rating.toFixed(1)} / 5`;

const ratingBadgeClasses = (rating: number) => {
  if (rating >= 4.5) {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (rating >= 3.5) {
    return 'bg-sky-100 text-sky-700';
  }

  if (rating >= 2.5) {
    return 'bg-yellow-100 text-yellow-700';
  }

  return 'bg-orange-100 text-orange-700';
};

type TabKey = 'bookings' | 'reviews';

const PublicSocialCard: React.FC<PublicSocialCardProps> = ({
  user,
  visibility,
  visitedPlaces,
  contactDisplay,
  hobbies,
  bookings,
  reviews,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('bookings');

  const messenger = useMessenger();
  const handleDirectMessage = () => {
    messenger.openChat({
      id: user.id,
      name: user.displayedName,
      image: user.image ?? '',
    });
  };

  const initials = useMemo(() => {
    return user.displayedName.trim().charAt(0).toUpperCase() || 'U';
  }, [user.displayedName]);

  const renderVisitedPlaces = () => {
    const withCities = visitedPlaces.filter(
      (place): place is SocialCardVisitedPlace & { city: string } =>
        typeof place.city === 'string' && place.city.trim().length > 0,
    );

    if (withCities.length === 0) {
      return <p className="text-sm text-black/30">Destinations not added yet.</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {withCities.map((place) => {
          const city = place.city.trim();

          return (
            <span
              key={`${place.countryCode}-${city}`}
              className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black"
            >
              <span className="flex h-4 w-6 items-center justify-center overflow-hidden rounded-sm bg-white/30">
                <Image
                  src={`/images/flags/${place.countryCode.toLowerCase()}.svg`}
                  alt={city}
                  width={24}
                  height={16}
                />
              </span>
              <span>{city}</span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white shadow-xl">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-white backdrop-blur-sm shadow-md hover:shadow-lg transition z-0" />

            {/* ⬇️ Add button here (top-right of the card) */}
            <button
              type="button"
              onClick={handleDirectMessage}
              className="absolute top-3 right-3 z-20 px-4 py-2 rounded-full bg-white text-neutral-900 shadow-md border border-neutral-200 tracking-[0.14em] text-[11px] sm:text-xs font-semibold hover:shadow-lg transition"
              title="Direct Message"
            >
              DIRECT MESSAGE
            </button>
          <div className="absolute inset-0 bg-white backdrop-blur-sm shadow-md hover:shadow-lg transition" />
          <div className="relative space-y-6 px-10 py-0 md:py-4 text-black">
            
            {user.isSuspended && (
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Suspended account
              </span>
            )}

            {(visibility.image || visibility.name || visibility.profession) && (
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {visibility.image && (
                  user.image ? (
                    <Image
                      src={user.image}
                      alt={user.displayedName}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold text-white">
                      {initials}
                    </div>
                  )
                )}
                <div className="space-y-1">
                  {visibility.name && (
                    <p className="text-3xl font-semibold tracking-tight">{user.displayedName}</p>
                  )}
                  {visibility.profession && user.profession && (
                    <p className="text-sm text-black/80">{user.profession}</p>
                  )}
                </div>
              </div>
            )}

            {visibility.bio && user.bio && (
              <p className="whitespace-pre-line text-base leading-relaxed text-black/90">{user.bio}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibility.email && (
                <div className="rounded-2xl bg-neutral-100 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-black/60">Email</p>
                  <p className="break-words font-medium text-sm">{user.email ?? 'Not provided'}</p>
                  <div className="mt-2">
                    <VerificationBadge
                      verified={user.emailVerified}
                      pendingLabel="Pending verification"
                      size="md"
                      />
                </div>
                </div>
              )}

              {visibility.phone && (
                <div className="rounded-2xl bg-neutral-100 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-black/60">Phone</p>
                  <p className="break-words font-medium text-sm">{user.phone ?? 'Not provided'}</p>
                  <div className="mt-2">
                    <VerificationBadge
                      verified={user.phoneVerified}
                      pendingLabel="Pending verification"
                      size="md"
                    />
                  </div>
                </div>
              )}

              {visibility.contacts && (
                <div className="rounded-2xl bg-neutral-100 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-black/60">Preferred contacts</p>
                  <ul className="mt-2 space-y-1 text-sm text-black/90">
                    {contactDisplay.map((contact) => (
                      <li key={contact}>{contact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(visibility.countries || visibility.cities) && (
                <div className="rounded-2xl bg-neutral-100 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-black/60">Visited destinations</p>
                  <div className="mt-2">{renderVisitedPlaces()}</div>
                </div>
              )}

              {visibility.hobbies && (
                <div className="rounded-2xl bg-neutral-100 px-4 py-3 sm:col-span-2 lg:col-span-2">
                  <p className="text-xs uppercase tracking-widest text-black/60">Hobbies &amp; interests</p>
                  {hobbies.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hobbies.map((hobby) => (
                        <span
                          key={hobby}
                          className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-white/70">No hobbies shared yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-10 px-6 py-10 sm:px-10">
          <section className="">
            <div className="flex justify-center">
            </div>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">

              {/* <div className="flex w-full rounded-full border border-neutral-200 bg-neutral-50 p-1 sm:w-auto">
                {(['bookings', 'reviews'] as TabKey[]).map((tab) => {
                  const isActive = activeTab === tab;
                  const label = tab === 'bookings'
                    ? `Bookings (${bookings.length})`
                    : `Reviews (${reviews.length})`;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={clsx(
                        'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none',
                        isActive
                          ? 'bg-neutral-900 text-white shadow'
                          : 'text-neutral-600 hover:text-neutral-900'
                      )}
                    >
                      {tab === 'bookings' && isActive && (
                        <span className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-md" />
                        </span>
                      )}
                      {tab === 'reviews' && isActive && (
                        <span className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-amber-400 opacity-75 animate-ping" />
                          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-amber-500 shadow-md" />
                        </span>
                      )}
                      {label}
                    </button>
                  );
                })}
              </div> */}
            </div>

            {/* {activeTab === 'bookings' ? (
              <div className="flex flex-col gap-4">
                {bookings.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                    No bookings recorded yet.
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={booking.listingHref}
                      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-lg"
                    >
                      <div className="relative aspect-[4/3] w-full bg-neutral-100">
                        {booking.coverImage ? (
                          <Image
                            src={booking.coverImage}
                            alt={booking.listingTitle}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                            No image available
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 px-4 py-4">
                        <p className="text-sm font-semibold text-neutral-900">{booking.listingTitle}</p>
                        <dl className="space-y-1 text-xs text-neutral-600">
                          <div className="flex items-center justify-between">
                            <dt className="uppercase tracking-[0.2em] text-neutral-400">Booked on</dt>
                            <dd>{formatDate(booking.createdAt)}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="uppercase tracking-[0.2em] text-neutral-400">Experience date</dt>
                            <dd>{formatDate(booking.startDate)}</dd>
                          </div>
                        </dl>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                    No reviews left on the platform yet.
                  </div>
                ) : (
                  reviews.map((review) => (
                    <Link
                      key={review.id}
                      href={review.listingHref}
                      className="block rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 text-sm font-semibold text-neutral-800">
                          <span
                            className={clsx(
                              'rounded-full px-3 py-1 text-xs font-semibold',
                              ratingBadgeClasses(review.rating),
                            )}
                          >
                            {ratingLabel(review.rating)}
                          </span>
                          <span>{review.listingTitle}</span>
                        </div>
                        <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{review.comment}</p>
                    </Link>
                  ))
                )}
              </div>
            )} */}

            <div className="flex justify-center w-full pb-6">
              <Heading
                title="Just me, telling how it really was."
                subtitle=""
                center
              />
            </div>

            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                  No reviews left on the platform yet.
                </div>
              ) : (
                reviews.map((review) => (
                  <Link
                    key={review.id}
                    href={review.listingHref}
                    className="block rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 text-sm font-semibold text-neutral-800">
                        <span
                          className={clsx(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            ratingBadgeClasses(review.rating),
                          )}
                        >
                          {ratingLabel(review.rating)}
                        </span>
                        <span>{review.listingTitle}</span>
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600">{review.comment}</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PublicSocialCard;
