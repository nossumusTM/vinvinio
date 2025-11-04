'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { SafeListing, SafeUser } from "@/app/(marketplace)/types";
import useCountries from "@/app/(marketplace)/hooks/useCountries";
import Avatar from "@/app/(marketplace)/components/Avatar";
import Heading from "@/app/(marketplace)/components/Heading";
import { HostCardReview } from "@/app/(marketplace)/actions/getHostCardData";
import Link from "next/link";
import { twMerge } from 'tailwind-merge';
import { FaCheckCircle } from 'react-icons/fa';
import { HiOutlineShieldExclamation } from 'react-icons/hi';

interface HostCardClientProps {
  host: SafeUser;
  listings: SafeListing[];
  reviews: HostCardReview[];
}

type TabKey = 'experiences' | 'reviews';

const tabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

const formatPrice = (price: number) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `€${price}`;
  }
};

const HostCardClient: React.FC<HostCardClientProps> = ({ host, listings, reviews }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('experiences');
  const { getByValue } = useCountries();

  const coverImage = useMemo(() => {
    const firstListingWithImage = listings.find((listing) => Array.isArray(listing.imageSrc) && listing.imageSrc.length > 0);
    return firstListingWithImage?.imageSrc?.[0] ?? null;
  }, [listings]);

  const primaryLocation = useMemo(() => {
    const locationValue = listings[0]?.locationValue;
    if (!locationValue) return null;
    return getByValue(locationValue);
  }, [getByValue, listings]);

  const spokenLanguages = useMemo(() => {
    const languageSet = new Set<string>();
    listings.forEach((listing) => {
      (listing.languages ?? []).forEach((language) => {
        if (language) {
          languageSet.add(language);
        }
      });
    });
    return Array.from(languageSet);
  }, [listings]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <Heading
        title="Host profile card"
        subtitle="A quick glance at the host's experiences and reputation."
      />

      <div className="rounded-3xl overflow-hidden shadow-xl border border-neutral-200 bg-white">
        <div className="relative h-56 sm:h-64 md:h-72">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`Cover for ${host.name ?? host.hostName ?? 'host'}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-700 to-neutral-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar src={host.image} name={host.name ?? host.hostName ?? 'Host'} size={92} />
                  <div className="absolute -top-1 -right-1">
                    {host.identityVerified ? (
                      <div className="flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg p-1" title="Identity verified">
                        <FaCheckCircle className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center rounded-full bg-white/70 text-amber-600 shadow-lg p-1" title="Identity verification pending">
                        <HiOutlineShieldExclamation className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-white drop-shadow-lg">
                  <p className="text-2xl font-semibold">
                    {host.hostName || host.name || 'Host'}
                  </p>
                  {host.legalName && (
                    <p className="text-sm text-white/80">{host.legalName}</p>
                  )}
                  {primaryLocation && (
                    <p className="text-sm text-white/80">
                      Experiences in {primaryLocation.label}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-white/90">
                {host.profession && (
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                    {host.profession}
                  </span>
                )}
                {spokenLanguages.length > 0 ? (
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                    Speaks {spokenLanguages.join(', ')}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex flex-col gap-6">
            {host.bio && (
              <p className="text-base leading-relaxed text-neutral-700">
                {host.bio}
              </p>
            )}

            <div>
              <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1">
                {(['experiences', 'reviews'] as TabKey[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={twMerge(
                      'px-4 py-2 text-sm font-medium rounded-full transition-all',
                      activeTab === tab
                        ? 'bg-neutral-900 text-white shadow'
                        : 'text-neutral-600 hover:text-neutral-900'
                    )}
                  >
                    {tab === 'experiences' ? 'Live experiences' : 'Reviews'}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-[220px]">
              <AnimatePresence mode="wait">
                {activeTab === 'experiences' ? (
                  <motion.div
                    key="experiences"
                    variants={tabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="grid gap-5 md:grid-cols-2"
                  >
                    {listings.length === 0 && (
                      <div className="col-span-full rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                        This host has no live experiences just yet.
                      </div>
                    )}

                    {listings.map((listing) => (
                      <Link
                        key={listing.id}
                        href={listing.slug ? `/listings/${listing.slug}` : `/listings/${listing.id}`}
                        className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-lg"
                      >
                        <div className="relative h-48">
                          {listing.imageSrc?.[0] ? (
                            <Image
                              src={listing.imageSrc?.[0] as string}
                              alt={listing.title}
                              fill
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-600 to-neutral-500" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3 text-white drop-shadow">
                            <p className="text-lg font-semibold">{listing.title}</p>
                            <p className="text-sm text-white/80">Starting from {formatPrice(listing.price)}</p>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <p className="text-sm text-neutral-600 line-clamp-3">{listing.description}</p>
                          {listing.locationValue && (
                            <p className="text-xs uppercase tracking-widest text-neutral-400">
                              {getByValue(listing.locationValue)?.label ?? 'Location pending'}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="reviews"
                    variants={tabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {reviews.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                        No reviews have been published yet.
                      </div>
                    )}

                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 space-y-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-neutral-900">{review.listingTitle}</p>
                            <p className="text-sm text-neutral-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2 text-amber-500">
                            {'★'.repeat(Math.max(1, Math.min(review.rating, 5)))}
                            <span className="text-sm font-medium text-neutral-600">
                              {review.reviewerName}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostCardClient;

