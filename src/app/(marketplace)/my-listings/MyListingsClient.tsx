'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';
import { FiClock, FiMapPin, FiUsers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

import { FiEye, FiEyeOff } from "react-icons/fi";
import { BsAlphabet } from "react-icons/bs";
import { TiSortAlphabeticallyOutline } from "react-icons/ti";
import { RiLockPasswordLine } from "react-icons/ri";

import ConfirmPopup from '../components/ConfirmPopup';

import Container from '@/app/(marketplace)/components/Container';
import Heading from '@/app/(marketplace)/components/Heading';
import Button from '@/app/(marketplace)/components/Button';

import type { SafeListing, SafeUser } from '@/app/(marketplace)/types';

import { ListingStatus } from '@prisma/client'; // adjust the path if different
import type { $Enums } from '@prisma/client';

interface MyListingsClientProps {
  listings: SafeListing[];
  currentUser: SafeUser;
}

const STATUS_STYLES = {
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
  awaiting_reapproval: {
    label: 'Awaiting re-approval',
    badgeClass: 'bg-purple-100 text-purple-800 border border-purple-200',
  },
  inactive: {
    label: 'Inactive',
    badgeClass: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
  },
} as const satisfies Record<$Enums.ListingStatus, { label: string; badgeClass: string }>;

const TAB_ITEMS = [
  { key: 'approved',            label: 'Live experiences',        ping: 'bg-emerald-300', dot: 'bg-emerald-500' },
  { key: 'pending',             label: 'Awaiting review',         ping: 'bg-amber-300',  dot: 'bg-amber-500'  },
  { key: 'revision',            label: 'Revision requests',       ping: 'bg-blue-400',   dot: 'bg-blue-600'   },
  { key: 'awaiting_reapproval', label: 'Awaiting re-approval',    ping: 'bg-purple-400', dot: 'bg-purple-600' },
  { key: 'inactive',            label: 'Inactive experiences',    ping: 'bg-neutral-300',dot: 'bg-neutral-500'},
] as const;

const MyListingsClient: React.FC<MyListingsClientProps> = ({ listings, currentUser }) => {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [tab, setTab] = useState<'pending' | 'revision' | 'approved' | 'inactive' | 'awaiting_reapproval'>('approved');

  const [showPassword, setShowPassword] = useState(false);

  const regionNames = useMemo(
  () => new Intl.DisplayNames(['en'], { type: 'region' }),
  []
);

const [showDeactivate, setShowDeactivate] = useState(false);
const [selectedListing, setSelectedListing] = useState<SafeListing | null>(null);
const [deactivatePassword, setDeactivatePassword] = useState('');

const cap = (s?: string | null) => (typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1) : s ?? '');

const parseLocation = (value?: string | null) => {
  if (!value) return null;
  // expected like "milan-IT" or "rome-it" or just "IT"
  const parts = String(value).split('-');
  const countryCode = parts.pop()?.toUpperCase() || '';
  const citySlug = parts.join('-');
  const city = citySlug
    ? citySlug.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    : '';
  const countryName = countryCode ? regionNames.of(countryCode) : '';
  return countryCode && countryName ? { city, countryCode, countryName } : null;
};

const grouped = useMemo(() => {
  const pending = listings.filter((l) => l.status === 'pending');
  const revision = listings.filter((l) => l.status === 'revision');
  const awaitingReapproval = listings.filter((l) => l.status === 'awaiting_reapproval');
  const approved = listings.filter((l) => l.status === 'approved');
  const inactive = listings.filter((l) => l.status === 'inactive');
  return { pending, revision, awaiting_reapproval: awaitingReapproval, approved, inactive };
}, [listings]);

const filtered = useMemo(() => {
  const byTab: Record<typeof tab, SafeListing[]> = {
    pending: grouped.pending,
    revision: grouped.revision,
    awaiting_reapproval: grouped.awaiting_reapproval,
    approved: grouped.approved,
    inactive: grouped.inactive,
  };
  return byTab[tab] ?? [];
}, [grouped, tab]);

const tabVariants = {
  initial: { opacity: 0, y: 8, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.2 } },
  exit:    { opacity: 0, y: -8, filter: 'blur(2px)', transition: { duration: 0.15 } },
};

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
      toast.success('Activation request sent to moderation', {
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
        return 'Custom pricing';
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
        case 'awaiting_reapproval':
          return { label: 'Activation requested on', value: listing.updatedAt };
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

    const infoCardBase =
      'flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 shadow-md backdrop-blur-sm';

    return (
      <article
          key={listing.id}
          className="rounded-3xl shadow-md bg-white/90 p-8 ring-1 ring-transparent transition hover:shadow-lg sm:p-10"
        >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
                  <div
                    className="
                      relative 
                      aspect-[4/3] 
                      w-full 
                      max-w-[420px]     /* cap image width on desktops */
                      mx-auto           /* center when capped */
                      overflow-hidden 
                      rounded-2xl 
                      bg-neutral-100 
                      ring-1 ring-inset ring-neutral-200/60
                    "
                  >
          {/* media stays the same */}
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
              <Image src={coverMedia} alt={listing.title} fill className="object-cover" />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
              No media uploaded
            </div>
          )}

          {/* NEW: submitted/approved date box (top-left) */}
          {/* <div className="absolute left-3 top-3 rounded-xl bg-white/90 px-3 py-2 text-[11px] shadow-md ring-1 ring-neutral-200">
            <div className="font-semibold text-neutral-600">{timestampMeta.label}</div>
            <div className="font-medium text-neutral-900">{formattedTimestamp}</div>
          </div> */}

          {/* Move status chip to top-right to avoid overlap */}
          <span
            className={clsx(
              'absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
              statusMeta.badgeClass,
            )}
          >
            {statusMeta.label}
          </span>
        </div>

          <div className="flex flex-1 flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="absolute rounded-xl flex flex-row gap-1 rounded-lg bg-white/90 px-3 py-2 text-[11px] shadow-md ring-1 ring-neutral-200">
                    <div className="font-semibold text-neutral-600">{timestampMeta.label}</div>
                    <div className="font-medium text-neutral-900">{formattedTimestamp}</div>
                  </div>
                <div className="space-y-1 pt-10">
                  <h3 className="ml-1 mt-1 text-lg font-semibold text-neutral-900 sm:text-xl">
                    {listing.title}
                  </h3>
                </div>
                <div className="grid gap-1 text-sm text-neutral-500 sm:text-right">
                  <span className="ml-1 md:ml-0 font-semibold text-neutral-800">{displayPrice}</span>
                  <span className='ml-1 md:ml-0'>{pricingSummary}</span>
                </div>
              </div>
              <p className="ml-1 text-sm leading-relaxed text-neutral-600 line-clamp-4 md:line-clamp-3">
                {listing.description}
              </p>
              {/* <dl className="flex flex-row flex-wrap w-full items-center justify-start gap-3 text-sm text-neutral-500">
                <div className={clsx(infoCardBase, 'sm:max-w-[230px]')}>
                  <span className="flex h-10 w-10 items-center bg-neutral-100 justify-center rounded-xl text-neutral-600">
                    <FiUsers className="text-base" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[8px] font-semibold uppercase tracking-wide text-neutral-500">Guests</dt>
                    <dd className="truncate font-medium text-neutral-800">{listing.guestCount}</dd>
                  </div>
                </div>
                {listing.durationCategory && (
                  <div className={clsx(infoCardBase, 'sm:max-w-[230px]')}>
                    <span className="flex h-10 w-10 items-center bg-neutral-100 justify-center rounded-xl text-neutral-600">
                      <FiClock className="text-base" />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[8px] font-semibold uppercase tracking-wide text-neutral-500">Duration</dt>
                      <dd className="truncate font-medium text-neutral-800">{cap(listing.durationCategory)}</dd>
                    </div>
                  </div>
                )}
                {listing.locationValue && (() => {
                  const loc = parseLocation(listing.locationValue);
                  if (!loc) return null;
                  return (
                    <div className={clsx(infoCardBase, 'sm:col-span-3 sm:max-w-2xl')}>
                      <span className="flex h-10 w-10 items-center bg-neutral-100 justify-center rounded-xl text-neutral-600 overflow-hidden">
                        <Image
                          src={`/flags/${loc.countryCode.toLowerCase()}.svg`}
                          alt={loc.countryName}
                          width={24}
                          height={18}
                          className="h-[18px] w-[24px] object-cover rounded-[3px]"
                        />
                      </span>
                      <div className="min-w-0">
                        <dt className="text-[8px] font-semibold uppercase tracking-wide text-neutral-500">Location</dt>
                        <dd className="line-clamp-2 text-[14px] font-medium text-neutral-800">
                          {loc.city ? `${cap(loc.city)}, ${loc.countryName}` : loc.countryName}
                        </dd>
                      </div>
                    </div>
                  );
                })()}
              </dl> */}
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              {listing.status === 'approved' && (
                <div className="sm:w-40">
                  <Button
                    small
                    label="Deactivate"
                    onClick={() => { setSelectedListing(listing); setDeactivatePassword(''); setShowDeactivate(true); }}
                    disabled={processingId === listing.id}
                  />
                </div>
              )}

              {listing.status === 'inactive' && (
                <div className="sm:w-40">
                  <Button
                    small
                    label="Activate"
                    onClick={() => handleActivate(listing)}
                    disabled={processingId === listing.id}
                  />
                </div>
              )}

              {listing.status === 'awaiting_reapproval' && (
                <div className="sm:w-full">
                  <div className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-purple-700 shadow-inner">
                    Pending moderator approval
                  </div>
                </div>
              )}

              <div className="sm:w-40">
                <Button
                  small
                  label="Edit listing"
                  onClick={() => handleEdit(listing)}
                  outline
                  disabled={processingId === listing.id}
                />
              </div>
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
    <Container className="py-10">
      <div className="pageadjust px-6 flex flex-col gap-10">
        <header className="space-y-2">
          <Heading
            title="Listingplace"
            subtitle={`Manage every experience you publish on Vuola, ${currentUser.name || currentUser.email || ''}`}
          />
        </header>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/70 p-10 text-center text-neutral-500">
          You haven&apos;t created any listings yet. Submit your first experience to see it here.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs slider */}
          {/* <div className="-mx-4 px-4">
            <div className="flex gap-2 overflow-x-auto pb-5 md:pb-10">
              {([
                { key: 'pending',  label: 'Awaiting review' },
                { key: 'revision', label: 'Awaiting re-approval' },
                { key: 'approved', label: 'Live experiences' },
                { key: 'inactive', label: 'Inactive experiences' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={clsx(
                    'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition',
                    tab === key
                      ? 'border-black bg-black text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div> */}

          <div className="flex gap-2 overflow-x-auto pb-5 md:pb-10">
            {TAB_ITEMS.map(({ key, label, ping, dot }) => {
              const isActive = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={clsx(
                    'flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'border-black bg-black text-white shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  )}
                >
                  {isActive && (
                    <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                      <span className={clsx('absolute inline-flex h-3.5 w-3.5 rounded-full opacity-75 animate-ping', ping)} />
                      <span className={clsx('relative inline-flex h-3.5 w-3.5 rounded-full shadow-md', dot)} />
                    </span>
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Cards grid: 1 col mobile, 2 cols desktop */}
          <AnimatePresence mode="wait">
            <motion.div key={tab} variants={tabVariants} initial="initial" animate="animate" exit="exit">
              {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 p-6 text-sm text-neutral-500">
              No listings in this section yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {filtered.map((listing) => renderListingCard(listing))}
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {showDeactivate && selectedListing && (
        <ConfirmPopup
          title="Deactivate listing"
          message={
            <div className="space-y-3">
              <p className="text-sm text-neutral-700">
                To deactivate <span className="font-semibold">{selectedListing.title}</span>, please enter your password.
              </p>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-800 transition"
                  >
                    {showPassword ? (
                      <RiLockPasswordLine size={18} />
                    ) : (
                      <BsAlphabet size={18} />
                    )}
                  </button>
                </div>
            </div>
          }
          cancelLabel="Cancel"
          confirmLabel="Deactivate"
          onCancel={() => { setShowDeactivate(false); setSelectedListing(null); }}
          onConfirm={async () => {
            if (!deactivatePassword) {
              toast.error('Password is required to deactivate a listing.');
              return;
            }
            setProcessingId(selectedListing.id);
            try {
              await axios.post(`/api/listings/${selectedListing.id}/deactivate`, { password: deactivatePassword });
              toast.success('Listing deactivated', {
                iconTheme: { primary: '#2200ffff', secondary: '#fff' },
              });
              router.refresh();
            } catch (error: any) {
              toast.error(error?.response?.data || 'Failed to deactivate listing.');
            } finally {
              setProcessingId(null);
            }
          }}
        />
      )}


      </div>
    </Container>
  );
};

export default MyListingsClient;
