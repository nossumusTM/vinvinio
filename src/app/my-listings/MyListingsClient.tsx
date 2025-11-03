'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';

import Container from '@/app/components/Container';
import Heading from '@/app/components/Heading';
import Button from '@/app/components/Button';

import type { SafeListing, SafeUser } from '@/app/types';

interface MyListingsClientProps {
  listings: SafeListing[];
  currentUser: SafeUser;
}

const STATUS_STYLES: Record<string, { label: string; badgeClass: string }> = {
  pending: {
    label: 'Pending review',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  revision: {
    label: 'Awaiting moderation',
    badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
  inactive: {
    label: 'Inactive',
    badgeClass: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
  },
};

const MyListingsClient: React.FC<MyListingsClientProps> = ({ listings, currentUser }) => {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const pending = listings.filter((listing) => listing.status === 'pending');
    const revision = listings.filter((listing) => listing.status === 'revision');
    const approved = listings.filter((listing) => listing.status === 'approved');
    const inactive = listings.filter((listing) => listing.status === 'inactive');

    return { pending, revision, approved, inactive };
  }, [listings]);

  const handleEdit = (listing: SafeListing) => {
    router.push(`/edit-listing/${listing.id}`);
  };

  const handleDeactivate = async (listing: SafeListing) => {
    const password = window.prompt('Please confirm your password to deactivate this listing.');
    if (!password) {
      toast.error('Password is required to deactivate a listing.');
      return;
    }

    setProcessingId(listing.id);
    try {
      await axios.post(`/api/listings/${listing.id}/deactivate`, { password });
      toast.success('Listing deactivated', {
        iconTheme: {
          primary: '#2200ffff',
          secondary: '#fff',
        },
      });
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data || 'Failed to deactivate listing.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleActivate = async (listing: SafeListing) => {
    setProcessingId(listing.id);
    try {
      await axios.post(`/api/listings/${listing.id}/activate`);
      toast.success('Listing activated', {
        iconTheme: {
          primary: '#2200ffff',
          secondary: '#fff',
        },
      });
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data || 'Failed to activate listing.');
    } finally {
      setProcessingId(null);
    }
  };

  const renderListingCard = (listing: SafeListing) => {
    const coverMedia = Array.isArray(listing.imageSrc) ? listing.imageSrc[0] : undefined;
    const isVideo = coverMedia ? /\.(mp4|webm|ogg)$/i.test(coverMedia) : false;

    const statusMeta = STATUS_STYLES[listing.status] ?? {
      label: listing.status,
      badgeClass: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
    };

    const pricingSummary = (() => {
      if (listing.pricingType === 'group') {
        if (listing.groupSize) {
          return `Group size: ${listing.groupSize}`;
        }
        return 'Flat group rate';
      }

      if (listing.pricingType === 'custom') {
        return 'Custom pricing tiers active';
      }

      return 'Per guest pricing';
    })();

    const displayPrice = (() => {
      if (listing.pricingType === 'group' && listing.groupPrice) {
        return `${listing.groupPrice.toLocaleString()} €`;
      }

      return `${listing.price.toLocaleString()} €`;
    })();

    const timestampMeta = (() => {
      switch (listing.status) {
        case 'approved':
          return { label: 'Approved on', value: listing.updatedAt };
        case 'inactive':
          return { label: 'Deactivated on', value: listing.updatedAt };
        case 'revision':
          return { label: 'Last submitted', value: listing.updatedAt };
        default:
          return { label: 'Submitted on', value: listing.createdAt };
      }
    })();

    const formattedTimestamp = (() => {
      try {
        return format(new Date(timestampMeta.value), 'PPpp');
      } catch {
        return '—';
      }
    })();

    return (
      <article
        key={listing.id}
        className="rounded-3xl border border-neutral-200/70 bg-white/90 p-4 shadow-sm ring-1 ring-transparent transition hover:shadow-lg hover:ring-neutral-200 sm:p-6"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-inset ring-neutral-200/60">
            {coverMedia ? (
              isVideo ? (
                <video
                  src={coverMedia}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  controls
                />
              ) : (
                <Image
                  src={coverMedia}
                  alt={listing.title}
                  fill
                  className="object-cover"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
                No media uploaded
              </div>
            )}
            <span
              className={clsx(
                'absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
                statusMeta.badgeClass,
              )}
            >
              {statusMeta.label}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-neutral-900 sm:text-xl">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {timestampMeta.label}: <span className="font-medium text-neutral-700">{formattedTimestamp}</span>
                  </p>
                </div>
                <div className="grid gap-1 text-sm text-neutral-500 sm:text-right">
                  <span className="font-semibold text-neutral-800">{displayPrice}</span>
                  <span>{pricingSummary}</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-neutral-600 line-clamp-4 md:line-clamp-3">
                {listing.description}
              </p>
              <dl className="grid grid-cols-1 gap-3 text-sm text-neutral-500 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-2xl bg-neutral-50 px-3 py-2">
                  <span className="text-neutral-400">Guests</span>
                  <span className="font-medium text-neutral-700">{listing.guestCount}</span>
                </div>
                {listing.durationCategory && (
                  <div className="flex items-center gap-2 rounded-2xl bg-neutral-50 px-3 py-2">
                    <span className="text-neutral-400">Duration</span>
                    <span className="font-medium text-neutral-700">{listing.durationCategory}</span>
                  </div>
                )}
                {listing.locationValue && (
                  <div className="flex items-center gap-2 rounded-2xl bg-neutral-50 px-3 py-2 sm:col-span-2">
                    <span className="text-neutral-400">Location</span>
                    <span className="font-medium text-neutral-700">{listing.locationValue}</span>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="w-full sm:w-auto">
                <Button
                  small
                  label="Edit listing"
                  onClick={() => handleEdit(listing)}
                  outline
                  disabled={processingId === listing.id}
                />
              </div>

              {listing.status === 'approved' && (
                <div className="w-full sm:w-auto">
                  <Button
                    small
                    label="Deactivate"
                    onClick={() => handleDeactivate(listing)}
                    disabled={processingId === listing.id}
                  />
                </div>
              )}

              {listing.status === 'inactive' && (
                <div className="w-full sm:w-auto">
                  <Button
                    small
                    label="Activate"
                    onClick={() => handleActivate(listing)}
                    disabled={processingId === listing.id}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderSection = (
    title: string,
    description: string,
    data: SafeListing[],
  ) => (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-500">{description}</p>
      </header>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 p-6 text-sm text-neutral-500">
          No listings in this section yet.
        </div>
      ) : (
        <div className="grid gap-6">
          {data.map((listing) => renderListingCard(listing))}
        </div>
      )}
    </section>
  );

  return (
    <Container>
      <div className="flex flex-col gap-10 py-10">
        <header className="space-y-2">
          <Heading
            title="My listings"
            subtitle={`Manage every experience you publish on Vuola, ${currentUser.name || currentUser.email || ''}`}
          />
        </header>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-10 text-center text-neutral-500">
            You haven&apos;t created any listings yet. Submit your first experience to see it here.
          </div>
        ) : (
          <div className="space-y-12">
            {renderSection(
              'Awaiting review',
              'Experiences pending moderator approval or resubmitted for changes.',
              grouped.pending,
            )}

            {renderSection(
              'Awaiting re-approval',
              'Listings you edited that are waiting for moderators to review updates.',
              grouped.revision,
            )}

            {renderSection(
              'Live experiences',
              'Approved listings currently visible to guests.',
              grouped.approved,
            )}

            {renderSection(
              'Inactive experiences',
              'Listings you have deactivated. Reactivate them when you are ready.',
              grouped.inactive,
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export default MyListingsClient;
