'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import clsx from 'clsx';

import type { SocialCardVisitedPlace } from '@/app/(marketplace)/types';

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

  const initials = useMemo(() => {
    return user.displayedName.trim().charAt(0).toUpperCase() || 'U';
  }, [user.displayedName]);

  const renderVisitedPlaces = () => {
    if (visitedPlaces.length === 0) {
      return <p className="text-sm text-neutral-500">Destinations not added yet.</p>;
    }

    return (
      <div className="flex flex-wrap gap-3">
        {visitedPlaces.map((place) => (
          <span
            key={`${place.countryCode}-${place.city ?? 'city'}`}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700"
          >
            <span className="flex h-4 w-6 items-center justify-center overflow-hidden rounded-sm bg-white shadow">
              <Image
                src={`/images/flags/${place.countryCode.toLowerCase()}.svg`}
                alt={place.countryName}
                width={24}
                height={16}
              />
            </span>
            <span>
              {place.city ? `${place.city}, ${place.countryName}` : place.countryName}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-xl">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 opacity-90" />
          <div className="relative space-y-6 p-10 text-white">
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
                    <p className="text-sm text-white/80">{user.profession}</p>
                  )}
                </div>
              </div>
            )}

            {visibility.bio && user.bio && (
              <p className="whitespace-pre-line text-base leading-relaxed text-white/90">{user.bio}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {visibility.email && (
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-white/60">Email</p>
                  <p className="break-words font-medium">{user.email ?? 'Not provided'}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold">
                    <span
                      className={clsx('inline-flex h-2.5 w-2.5 rounded-full', {
                        'bg-emerald-300': user.emailVerified,
                        'bg-white/40': !user.emailVerified,
                      })}
                    />
                    {user.emailVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
              )}

              {visibility.phone && (
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-white/60">Phone</p>
                  <p className="break-words font-medium">{user.phone ?? 'Not provided'}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold">
                    <span
                      className={clsx('inline-flex h-2.5 w-2.5 rounded-full', {
                        'bg-emerald-300': user.phoneVerified,
                        'bg-white/40': !user.phoneVerified,
                      })}
                    />
                    {user.phoneVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-10 sm:px-10">
          <section className="space-y-4">
            {visibility.contacts && (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">Preferred contacts</h3>
                <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                  {contactDisplay.map((contact) => (
                    <li key={contact}>{contact}</li>
                  ))}
                </ul>
              </div>
            )}

            {(visibility.countries || visibility.cities) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">Visited destinations</h3>
                {renderVisitedPlaces()}
              </div>
            )}

            {visibility.hobbies && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">Hobbies & interests</h3>
                {hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map((hobby) => (
                      <span
                        key={hobby}
                        className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No hobbies shared yet.</p>
                )}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div className="flex w-full rounded-full border border-neutral-200 bg-neutral-50 p-1 sm:w-auto">
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
              </div>
            </div>

            {activeTab === 'bookings' ? (
              <div className="grid gap-4 md:grid-cols-2">
                {bookings.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                    No bookings recorded yet.
                  </div>
                ) : (
                  bookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={booking.listingHref}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-lg"
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
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
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
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PublicSocialCard;
