'use client';

import Image from 'next/image';
import { redirect } from 'next/navigation';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
import Modal from '@/app/(marketplace)/components/modals/Modal';

import Container from '@/app/(marketplace)/components/Container';
import Heading from '@/app/(marketplace)/components/Heading';
import Button from '@/app/(marketplace)/components/Button';

import { MAX_PARTNER_POINT_VALUE } from '@/app/(marketplace)/constants/partner';
import type { SafeListing, SafeUser } from '@/app/(marketplace)/types';
import VinPointBoostModal from '../components/VinPointBoostModal';

type KnownListingStatus = Extract<SafeListing['status'], string>;

interface MyListingsClientProps {
  listings: SafeListing[];
  currentUser: SafeUser;
  activeTab: TabKey;
}

type StatusStylesMap =
  Record<KnownListingStatus, { label: string; badgeClass: string }> & {
    awaiting_reapproval: { label: string; badgeClass: string };
};

type TabKey = KnownListingStatus | 'awaiting_reapproval';

const STATUS_STYLES: Record<TabKey, { label: string; badgeClass: string }> = {
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
};

const TAB_ITEMS = [
  { key: 'approved',            label: 'Live experiences',        ping: 'bg-emerald-300', dot: 'bg-emerald-500' },
  { key: 'pending',             label: 'Awaiting review',         ping: 'bg-amber-300',  dot: 'bg-amber-500'  },
  { key: 'revision',            label: 'Revision requests',       ping: 'bg-blue-400',   dot: 'bg-blue-600'   },
  { key: 'awaiting_reapproval', label: 'Awaiting re-approval',    ping: 'bg-purple-400', dot: 'bg-purple-600' },
  { key: 'inactive',            label: 'Inactive experiences',    ping: 'bg-neutral-300',dot: 'bg-neutral-500'},
  { key: 'rejected',            label: 'Rejected',                ping: 'bg-rose-300',   dot: 'bg-rose-600'   },
] as const satisfies readonly { key: TabKey; label: string; ping: string; dot: string }[];

const TABS: TabKey[] = TAB_ITEMS.map(t => t.key);
const DEFAULT_TAB: TabKey = 'approved';

const MyListingsClient: React.FC<MyListingsClientProps> = ({ listings, currentUser, activeTab }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialTabParam = (searchParams?.get('tab') as TabKey | null) ?? null;
  const initialTab = (initialTabParam && TABS.includes(initialTabParam)) ? initialTabParam : DEFAULT_TAB;

  const [tab, setTab] = useState<TabKey>(activeTab ?? DEFAULT_TAB);
  const didMountRef = useRef(false);
  const userChangedTabRef = useRef(false);

  const setTabGuarded = (next: TabKey) => {
    userChangedTabRef.current = true;   // → only after user acts do we sync URL
    setTab(next);
  };

  useEffect(() => {
    if (!userChangedTabRef.current) return; // only after a user click

    const sp = new URLSearchParams(searchParams?.toString() ?? window.location.search);
    if (sp.get('tab') === tab) return;

    sp.set('tab', tab);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // useEffect(() => {
  //   const qp = (searchParams?.get('tab') as TabKey | null) ?? null;
  //   const valid = qp && TABS.includes(qp);

  //   if (!didMountRef.current) {
  //     didMountRef.current = true;
  //     if (valid && qp !== tab) setTab(qp);
  //     return;
  //   }

  //   if (!userChangedTabRef.current && valid && qp !== tab) {
  //     setTab(qp);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [searchParams]);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const regionNames = useMemo(
    () => new Intl.DisplayNames(['en'], { type: 'region' }),
    []
  );

  const [showDeactivate, setShowDeactivate] = useState(false);
  const [selectedListing, setSelectedListing] = useState<SafeListing | null>(null);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [boostValue, setBoostValue] = useState<number>(0);
  const [isBoosting, setIsBoosting] = useState(false);
  const [boostListing, setBoostListing] = useState<SafeListing | null>(null);

  const cap = (s?: string | null) => (typeof s === 'string' && s.length ? s[0].toUpperCase() + s.slice(1) : s ?? '');

  const parseLocation = (value?: string | null) => {
    if (!value) return null;
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
    const pending = listings.filter(l => l.status === 'pending');
    const revision = listings.filter(l => l.status === 'revision');
    const awaitingReapproval = listings.filter(l => (l.status as TabKey) === 'awaiting_reapproval');
    const approved = listings.filter(l => l.status === 'approved');
    const inactive = listings.filter(l => l.status === 'inactive');
    const rejected = listings.filter(l => l.status === 'rejected');
    return { pending, revision, awaiting_reapproval: awaitingReapproval, approved, inactive, rejected };
  }, [listings]);

  const filtered = useMemo(() => {
    const byTab: Record<TabKey, SafeListing[]> = {
      pending: grouped.pending,
      revision: grouped.revision,
      awaiting_reapproval: grouped.awaiting_reapproval,
      approved: grouped.approved,
      inactive: grouped.inactive,
      rejected: grouped.rejected,
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

  const openBoostModal = (listing: SafeListing) => {
    setBoostListing(listing);
  };

  const handleBoostSubmit = async () => {
    if (!boostListing) return;

    const sanitizedValue = Math.min(
      MAX_PARTNER_POINT_VALUE,
      Math.max(0, Math.round(boostValue)),
    );

    setIsBoosting(true);
    try {
      await axios.post('/api/listings/punti', {
        listingId: boostListing.id,
        punti: sanitizedValue,
      });

      toast.success('VIN points updated for your listing.');
      setBoostListing(null);
      router.refresh();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data || 'Unable to update VIN points.';
      toast.error(message);
    } finally {
      setIsBoosting(false);
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
      if (tab === 'awaiting_reapproval') {
        return { label: 'Activation requested on', value: listing.updatedAt };
      }
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

    const infoCardBase =
      'flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 shadow-md backdrop-blur-sm';

    return (
      <article
        key={listing.id}
        className="rounded-3xl shadow-md bg-white/90 p-8 ring-1 ring-transparent transition hover:shadow-lg sm:p-10"
      >
          {/* >>> INSERT TIMESTAMP BLOCK HERE <<< */}
          <div className="mb-4">
            <div className="inline-block flex flex-row gap-1 w-fit rounded-xl bg-white/95 px-3 py-2 text-[10px] leading-tight shadow ring-1 ring-neutral-200">
              <div className="font-semibold text-neutral-600">{timestampMeta.label}</div>
              <div className="font-medium text-neutral-900">{formattedTimestamp}</div>
            </div>
          </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
          
          <div
            className="
              relative 
              aspect-[4/3] 
              w-full 
              max-w-[420px]
              mx-auto
              overflow-hidden 
              rounded-2xl 
              bg-neutral-100 
              ring-1 ring-inset ring-neutral-200/60
            "
          >
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

              {tab === 'awaiting_reapproval' && (
                <div className="sm:w-full">
                  <div className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-purple-700 shadow-inner">
                    Pending moderator approval
                  </div>
                </div>
              )}

              <div className="sm:w-40">
                <Button
                  small
                  label="Boost Listing"
                  onClick={() => openBoostModal(listing)}
                  outline
                  disabled={processingId === listing.id}
                />
              </div>

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
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-5 md:pb-10" role="tablist" aria-label="Listing status tabs">
              {TAB_ITEMS.map(({ key, label, ping, dot }) => {
                const isActive = tab === key;
                return (
                  <button
                    key={key}
                    id={`tab-${key}`}
                    aria-controls={`panel-${key}`}
                    aria-selected={isActive}
                    role="tab"
                    onClick={() => setTabGuarded(key)}
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

            {/* Cards grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                id={`panel-${tab}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
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

        {/* <div className="w-full h-full">
              <Modal
                isOpen={isVinvinModalOpen}
                onClose={handleVinvinClose}
                onSubmit={handleVinvinAction}
                closeOnSubmit={false}
                actionLoading={isProcessingPayment}
                title={vinvinStep === "amount" ? "Boost your vin point" : "Vin Point Manager "}
                actionLabel={vinvinActionLabel}
                body={vinvinModalBody}
                footer={undefined}
                disabled={isProcessingPayment || vinvinSuccess}
                className=""
                submitOnEnter={false}
                // optional: keep modal from being closed mid-payment
                // preventOutsideClose={isProcessingPayment}
              />
            </div> */}

        <VinPointBoostModal
          listing={boostListing}
          currentUserEmail={currentUser?.email}
          onClose={() => setBoostListing(null)}
          onSuccess={() => {
            setBoostListing(null);
            router.refresh();
          }}
        />

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