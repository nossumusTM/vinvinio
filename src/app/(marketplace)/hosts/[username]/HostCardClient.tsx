'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import NextImage from 'next/image';
import { FiCamera } from 'react-icons/fi';
import { BiUpload } from "react-icons/bi";
import { TbWorldUpload } from "react-icons/tb";
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { createPortal } from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';
import axios from 'axios';

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
import { GiBoltShield } from "react-icons/gi";
import { HiOutlineChatBubbleOvalLeft } from "react-icons/hi2";
import { BiSolidPaperPlane } from "react-icons/bi";
import Modal from '../../components/modals/Modal';
import CoverImageUploader from "../../components/CoverImageUploader";

import Cropper from 'react-easy-crop';
import getCroppedImg from '@/app/(marketplace)/utils/cropImage';

import useMessenger from '@/app/(marketplace)/hooks/useMessager';
import useLoginModal from '@/app/(marketplace)/hooks/useLoginModal';
import CountryFlagByLabel from '../../components/CountryFlagByLabel';
import { FiUsers, FiCalendar, FiHeart } from 'react-icons/fi';
import { useCallback } from 'react';

type HostCardReviewWithImage = HostCardReview & {
  reviewerImage?: string | null;
  userImage?: string | null;
  user?: { image?: string | null } | null;
};

const getReviewAvatarSrc = (r: HostCardReview): string | undefined => {
  const rr = r as HostCardReviewWithImage;
  return rr.reviewerImage ?? rr.userImage ?? rr.user?.image ?? undefined;
};

interface HostCardClientProps {
  host: SafeUser;
  listings: SafeListing[];
  reviews: HostCardReview[];
  currentUser?: SafeUser | null;
  isFollowing?: boolean;
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

const HostCardClient: React.FC<HostCardClientProps> = ({ host, listings, reviews, currentUser, isFollowing }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('experiences');
  const { getByValue } = useCountries();

  const messenger = useMessenger();
  const loginModal = useLoginModal();

  const [visibleReviews, setVisibleReviews] = useState(5);
  const [isOwner, setIsOwner] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverLoaded, setCoverLoaded] = useState(false);

  const [followersCount, setFollowersCount] = useState<number>(host.followersCount ?? 0);
  const [isFollowingHost, setIsFollowingHost] = useState<boolean>(Boolean(isFollowing));
  const [followBusy, setFollowBusy] = useState(false);

  const coverInputRef = useRef<HTMLInputElement | null>(null);

  type CropTarget = 'avatar' | 'cover';
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const busy = isCropping;

  const listingLikesCount = useMemo(
    () =>
      (typeof host.listingLikesCount === 'number'
        ? host.listingLikesCount
        : listings.reduce((sum, listing) => sum + (listing.likesCount ?? 0), 0)),
    [host.listingLikesCount, listings]
  );

  // local optimistic previews (optional)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview]   = useState<string | null>(null);

  const [showLangPopup, setShowLangPopup] = useState(false);
  const [langPopupPos, setLangPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const langBtnRef = useRef<HTMLButtonElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

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

  const toggleLangPopup = () => {
    const next = !showLangPopup;
    if (next && langBtnRef.current) {
      const r = langBtnRef.current.getBoundingClientRect();
      setLangPopupPos({ top: r.bottom + 8, left: r.left });
    }
    setShowLangPopup(next);
  };

  const handleContactHost = useCallback(async () => {
    try {
      const res = await fetch('/api/users/current', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 401) {
          loginModal.onOpen();
          return;
        }
        throw new Error(`Unexpected status: ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Unexpected response format');
      }

      const me = await res.json();
      if (!me?.id) {
        loginModal.onOpen();
        return;
      }

      if (host?.id) {
        messenger.openChat({
          id: host.id,
          name: host.hostName ?? host.name ?? 'Host',
          image: host.image ?? '',
        });
      }
    } catch (e) {
      console.error(e);
      loginModal.onOpen();
    }
  }, [host?.id, host?.name, host?.hostName, host?.image, loginModal, messenger]);

  const handleToggleFollow = useCallback(async () => {
    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    if (currentUser.id === host.id) {
      toast.error("You can't follow yourself.");
      return;
    }

    setFollowBusy(true);
    try {
      const response = isFollowingHost
        ? await axios.delete(`/api/hosts/${host.id}/follow`)
        : await axios.post(`/api/hosts/${host.id}/follow`);

      const nextCount = typeof response.data?.followersCount === 'number'
        ? response.data.followersCount
        : isFollowingHost
          ? Math.max(0, followersCount - 1)
          : followersCount + 1;

      setFollowersCount(nextCount);
      setIsFollowingHost((prev) => !prev);
    } catch (error) {
      console.error(error);
      toast.error('Unable to update follow status.');
    } finally {
      setFollowBusy(false);
    }
  }, [currentUser, followersCount, host.id, isFollowingHost, loginModal]);

  const coverImage = useMemo(() => {
    // 1) If user has uploaded a cover in profile
    if (coverImageUrl) return coverImageUrl;
    if ((host as any).coverImage) return (host as any).coverImage as string;

    // 2) Otherwise return null → triggers gray animated background placeholder
    return null;
  }, [coverImageUrl, host]);

  const pickCover  = () => coverInputRef.current?.click();

  const fileToDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const pickAvatar = () => avatarInputRef.current?.click();

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

  const averageRating = useMemo(() => {
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const starGradientId = useMemo(() => `starGradient-${host.id}`, [host.id]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  const slugifySegment = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const pathForListing = (listing: SafeListing) => {
    if (listing.slug) {
      const cat = listing.primaryCategory
        ? slugifySegment(listing.primaryCategory)
        : "experience";
      return `/tours/${cat}/${listing.slug}`;
    }
    return `/listings/${listing.id}`;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, target: CropTarget) => {
  const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataURL(file);
    setUploadedImage(dataUrl);
    setCropTarget(target);
    setIsCropping(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });

    // Clear input so selecting the same file later still triggers change
    e.target.value = '';
  };

  const onCropComplete = (_: any, area: any) => setCroppedAreaPixels(area);

  const handleCropCancel = () => {
    setIsCropping(false);
    setUploadedImage(null);
    setCropTarget(null);
    setCroppedAreaPixels(null);
  };

  const handleCropSubmit = async () => {
    if (!uploadedImage || !croppedAreaPixels || !cropTarget) return;

    // 1) produce cropped base64 (dataURL)
    const croppedDataUrl = await getCroppedImg(uploadedImage, croppedAreaPixels);

    // 2) optimistic local preview
    if (cropTarget === 'avatar') setAvatarPreview(croppedDataUrl);
    if (cropTarget === 'cover')  setCoverPreview(croppedDataUrl);
    setAvatarPreview(croppedDataUrl);

    setIsCropping(false);
    setUploadedImage(null);

    // 3) strip prefix for API
    const base64 = croppedDataUrl.replace(/^data:image\/\w+;base64,/, '');

    // 4) upload to the right endpoint
    try {
      if (cropTarget === 'avatar') {
        await axios.put('/api/users/profile-image', { image: base64 });
      } else {
        await axios.put('/api/users/cover', { image: base64 });
      }
    } catch (err) {
      console.error('Image upload failed', err);
      // (optional) rollback preview if you want
    } finally {
      setCropTarget(null);
      setCroppedAreaPixels(null);
    }
  };

  const signedUpText = useMemo(() => {
    const d = new Date(host.createdAt);
    const now = new Date();
    const days = Math.max(1, Math.floor((now.getTime() - d.getTime()) / 86400000));
    if (days < 30) return `Signed up ${days} day${days === 1 ? '' : 's'} ago`;
    if (now.getFullYear() === d.getFullYear()) {
      return `Signed up in ${d.toLocaleString(undefined, { month: 'long' })}`;
    }
    return `Signed up in ${d.getFullYear()}`;
  }, [host.createdAt]);

  const normalizeLangKey = (lang: string) =>
  lang
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, ''); // strip accents, e.g. "français" -> "francais"

  const languageToFlagCode: Record<string, string> = {
    // English
    english: 'gb',
    en: 'gb',
    inglese: 'gb',

    // Italian
    italian: 'it',
    italiano: 'it',
    it: 'it',

    // French
    french: 'fr',
    francais: 'fr',
    français: 'fr',
    fr: 'fr',

    // Spanish
    spanish: 'es',
    espanol: 'es',
    español: 'es',
    es: 'es',

    // German
    german: 'de',
    deutsch: 'de',
    de: 'de',

    // Portuguese
    portuguese: 'pt',
    portugues: 'pt',
    português: 'pt',
    pt: 'pt',

    // Russian
    russian: 'ru',
    русский: 'ru',
    ru: 'ru',

    // Turkish
    turkish: 'tr',
    türkçe: 'tr',
    turkce: 'tr',
    tr: 'tr',

    // More as needed
    chinese: 'cn',
    japanese: 'jp',
    korean: 'kr',
    dutch: 'nl',
    swedish: 'se',
    norwegian: 'no',
    danish: 'dk',
    finnish: 'fi',
    polish: 'pl',
    ukrainian: 'ua',
    azerbaijani: 'az',
    georgian: 'ge',
    hindi: 'in',
    greek: 'gr',
    czech: 'cz',
    slovak: 'sk',
    romanian: 'ro',
    bulgarian: 'bg',
    hungarian: 'hu',
  };

  const toFlagCode = (lang: string) =>
    languageToFlagCode[normalizeLangKey(lang)] ?? null;

  // If your files are pngs under /public/flags/<code>.png:
  // const flagSrc = (code: string) => `/flags/${code}.svg`;

  // const flagPath = (countryCode: string) =>
  //   `/flags/${countryCode.toLowerCase()}.svg`; // e.g. /flags/it.png
  // const flagPath = (cc: string) => `/flags/${cc.toLowerCase()}.svg`;

  const flagSrc = (code: string) => `/flags/${code}.svg`;
  const flagPath = (cc: string) => `/flags/${cc.toLowerCase()}.svg`;

  const normalizeCountryCode = (code: string) => {
    const c = String(code).toLowerCase().trim();

    const map3to2: Record<string, string> = {
      ita: 'it',
      esp: 'es',
      fra: 'fr',
      deu: 'de',
      usa: 'us',
      gbr: 'gb',
    };

    if (map3to2[c]) return map3to2[c];

    // Fallback: if it's longer than 2 chars, take first 2
    if (c.length > 2) return c.slice(0, 2);

    return c;
  };

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
     if (currentUser?.id) {
       setIsOwner(String(currentUser.id) === String(host.id));
     }
  }, [currentUser?.id, host.id]);

   useEffect(() => {
    if (currentUser?.id) return; // already resolved via prop
      (async () => {
        try {
          const r = await fetch('/api/users/current', {
            credentials: 'include',
            cache: 'no-store',
          });
          if (!r.ok) return;
          const me = await r.json();
        setIsOwner(Boolean(me?.id && me.id === host.id));
        setIsOwner(Boolean(me?.id && String(me.id) === String(host.id))); // normalize ids
        } catch {}
      })();
  }, [host.id, currentUser?.id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/users/cover?userId=${encodeURIComponent(host.id)}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setCoverImageUrl(data?.coverImage ?? null);
      } catch {}
    })();
    return () => { alive = false; };
  }, [host.id]);

  return (
    <div className="pageadjust max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* <Heading
        title="Host Card"
        subtitle="A quick glance at the host's experiences and reputation."
      /> */}

      <div className="rounded-3xl overflow-hidden shadow-xl border border-neutral-200 bg-white">
        <div className="relative h-56 sm:h-64 md:h-72">
          {coverPreview ? (
            <NextImage
              src={coverPreview}
              alt={`Cover for ${host.name ?? host.hostName ?? 'host'}`}
              fill
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" // 1x1 transparent
              className={`object-cover transition-[filter,opacity,transform] duration-500 ease-out
                        ${coverLoaded ? 'blur-0 opacity-100 scale-100' : 'blur-md opacity-80 scale-[1.02]'}`}
              onLoadingComplete={() => setCoverLoaded(true)}
              priority
            />
          ) : coverImage ? (
            <NextImage
              src={coverImage}
              alt={`Cover for ${host.name ?? host.hostName ?? 'host'}`}
              fill
              placeholder="blur"
              blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
              className={`object-cover transition-[filter,opacity,transform] duration-500 ease-out
                        ${coverLoaded ? 'blur-0 opacity-100 scale-100' : 'blur-md opacity-80 scale-[1.02]'}`}
              onLoadingComplete={() => setCoverLoaded(true)}
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-200" />
          )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {isOwner && (
              <>
                  <CoverImageUploader
                  disabled={busy}
                  onPreviewChange={(dataUrl) => {
                    setCoverLoaded(false);
                    setCoverPreview(dataUrl);
                  }}
                  onUploadStart={() => setUploadingCover(true)}
                  onUploadEnd={() => setUploadingCover(false)}
                  onUploadError={() => toast.error('Cover upload failed.')}
                  onUpload={async (croppedDataUrl) => {
                    const base64 = croppedDataUrl.replace(/^data:image\/\w+;base64,/, '');
                    await axios.put('/api/users/cover', { image: base64 });
                  }}
                  renderTrigger={({ open, uploading }) => (
                    <button
                      type="button"
                      onClick={open}
                      disabled={busy || uploading}
                      className="absolute aspect-square top-3 right-3 z-30 inline-flex items-center gap-2 rounded-full shadow-md text-white px-3 py-1.5 text-xs font-semibold hover:shadow-lg transition"
                      title=""
                    >
                      <TbWorldUpload className="font-semibold h-5 w-5" />
                      {uploading ? 'Uploading…' : uploadingCover ? 'Uploading…' : ''}
                    </button>
                  )}
                />
              </>
            )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-20">
          </div>

          <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {isOwner ? (
                    <>
                      <button
                        type="button"
                        onClick={pickAvatar}
                        disabled={busy}
                        className="group rounded-full outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-black/20"
                        title="Change avatar"
                      >
                        <div className="rounded-full overflow-hidden ring-0 transition shadow-md hover:shadow-lg cursor-pointer">
                          <Avatar
                            src={avatarPreview ?? host.image}
                            name={host.name ?? host.hostName ?? 'Host'}
                            size={92}
                          />
                        </div>
                      </button>

                      {/* Hidden input stays to receive the file */}
                     <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageSelect(e, 'avatar')}
                      />

                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageSelect(e, 'cover')}
                      />

                    </>
                  ) : (
                    <Avatar src={host.image} name={host.name ?? host.hostName ?? 'Host'} size={92} />
                  )}

                  <div className="absolute -top-2 -right-20">
                    
                  </div>
                </div>

                <div className="text-white drop-shadow-lg">
                  {!host.identityVerified ? (
                    <div className="px-2 py-1 bg-black/20 w-fit items-center justify-center gap-1 rounded-full shadow-md backdrop-blur-sm text-emerald-400 border border-emerald-400 text-[10px] font-bold">
                        <span>
                          ✓ ID VERIFIED
                        </span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-black/20 w-fit items-center justify-center gap-1 rounded-full shadow-md backdrop-blur-sm text-orange-400 border border-orange-400 text-[10px] font-bold">
                        ID IN REVIEW
                      </div>
                    )}
                  <div className='flex flex-row gap-1'>
                  <p className="text-2xl font-semibold flex items-center gap-2">
                    {host.username || host.name || 'Host'}
                  </p>

                  {!isOwner && (
                      <button
                        type="button"
                        onClick={handleToggleFollow}
                        disabled={followBusy}
                        className="inline-flex items-center gap-2 rounded-full shadow-lg px-2 py-0 text-xs font-semibold text-white backdrop-blur transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isFollowingHost ? 'Unfollow' : '+ Follow'}
                      </button>
                    )}
                  </div>
                  {/* {host.legalName && (
                    <p className="ml-1 text-sm text-white/80">{host.legalName}</p>
                  )} */}
                  {primaryLocation && ( <p className="w-fit mr-3.5 text-sm text-white/80 flex flex-row gap-1"> Located In <p className='font-semibold'>{primaryLocation.label.toUpperCase()}</p> </p> )}
                
                
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-white/90">
                {host.profession && (
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                    {host.profession}
                  </span>
                )}

                <div className="flex flex-col gap-1 md:gap-2 w-full items-start md:items-end text-left md:text-right">
                {reviews.length > 0 && (
                      <span className="mr-3.5 px-1 md:px-0 flex items-center gap-1 text-white/90">
                        {/* partial-fill star */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <defs>
                            <linearGradient id={starGradientId}>
                              <stop offset={`${(averageRating / 5) * 100}%`} stopColor="currentColor" />
                              <stop offset={`${(averageRating / 5) * 100}%`} stopColor="rgba(255,255,255,0.5)" />
                            </linearGradient>
                          </defs>
                          <path
                            fill={`url(#${starGradientId})`}
                            d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
                              14.81 8.63 12 2 9.19 8.63 2 9.24 
                              7.46 13.97 5.82 21 12 17.27z"
                          />
                        </svg>

                        <span className="text-sm font-medium">
                          {averageRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                        </span>
                      </span>
                    )}
                    {spokenLanguages.length > 0 ? (
                      <div className="relative flex items-center gap-2 p-2 shadow-xl rounded-xl">
                        <span className="text-sm font-medium text-white/90">Available In</span>

                        {/* Flags (first 3 always visible) */}
                        <div className="flex items-center gap-0.5">
                          {(spokenLanguages.slice(0, 3)).map((lang) => {
                            const code = toFlagCode(lang);
                            if (!code) {
                              return (
                                <span
                                  key={lang}
                                  className="px-2 py-1 rounded-full bg-white/20 text-xs text-white/90"
                                  title={lang}
                                >
                                  {lang}
                                </span>
                              );
                            }
                            return (
                              <span
                                key={lang}
                                className="inline-flex items-center justify-center rounded-sm overflow-hidden"
                                title={lang}
                              >
                                <NextImage
                                  src={flagSrc(code)}
                                  alt={lang}
                                  width={14}
                                  height={14}
                                  className="mr-1.5 h-4 w-6 object-cover rounded"
                                />
                              </span>
                            );
                          })}
                        </div>

                        {/* Show more button */}
                        {spokenLanguages.length > 3 && (
                          <button
                            ref={langBtnRef}
                            type="button"
                            onClick={toggleLangPopup}
                            className="inline-flex items-center rounded-full backdrop-blur-xs bg-transparent px-2 py-1 text-[11px] font-semibold text-white/90 hover:backdrop-blur-sm transition"
                            aria-expanded={showLangPopup}
                          >
                            +{spokenLanguages.length - 3} more
                            <FiChevronDown
                              className={twMerge('transition-transform', showLangPopup ? 'rotate-180' : 'rotate-0')}
                              size={14}
                            />
                          </button>
                        )}

                        {/* Popup with all languages */}
                        {isMounted && createPortal(
                          <AnimatePresence>
                            {showLangPopup && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.18 }}
                                className="fixed z-[99999] w-fit max-w-[85vw] bg-white text-neutral-800 rounded-xl shadow-2xl p-2"
                                style={{ top: langPopupPos.top, left: langPopupPos.left - 6 }}
                                onMouseLeave={() => setShowLangPopup(false)}
                              >

                                <div className="grid grid-cols-1 gap-1.5">
                                  {spokenLanguages.map((lang) => {
                                    const code = toFlagCode(lang);
                                    return (
                                      <div key={lang} className="flex items-center gap-1.5">
                                        {code ? (
                                          <NextImage
                                            src={flagSrc(code)}
                                            alt={lang}
                                            width={14}
                                            height={14}
                                            className="h-3.5 w-5 object-cover rounded"
                                          />
                                        ) : (
                                          <span className="inline-block h-3.5 w-5 rounded bg-neutral-200" />
                                        )}
                                        <span className="text-xs">{lang}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>,
                          document.body
                        )}
                      </div>
                    ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className="px-6 py-0">
          <div className="flex flex-col gap-6">
            {host.bio && (
              <p className="text-base leading-relaxed text-neutral-700">
                {host.bio}
              </p>
            )}

          {/* STATS → DIRECT MESSAGE → TABS */}
          <div className="flex w-full flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* LEFT: Followers / Bookings / Likes */}
            <div className="flex w-full flex-row flex-nowrap gap-2 overflow-x-auto scroll-smooth md:w-auto md:flex-wrap md:overflow-visible md:gap-3">
              {/* Followers */}
              <div className="inline-flex shrink-0 min-w-[100px] flex-col rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-black/90 shadow-md backdrop-blur-md">
                <div className="flex items-center gap-1">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/70">
                    Followers
                  </p>
                </div>
                <p className="mt-0.5 text-lg font-semibold leading-tight">
                  {followersCount}
                </p>
              </div>

              {/* Bookings */}
              <div className="inline-flex shrink-0 min-w-[100px] flex-col rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-black/90 shadow-md backdrop-blur-md">
                <div className="flex items-center gap-1">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-sky-400 shadow-sm" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/70">
                    Bookings
                  </p>
                </div>
                <p className="mt-0.5 text-lg font-semibold leading-tight">
                  {host.allTimeBookingCount ?? 0}
                </p>
              </div>

              {/* Likes */}
              <div className="inline-flex shrink-0 min-w-[115px] flex-col rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-black/90 shadow-md backdrop-blur-md">
                <div className="flex items-center gap-1">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-sm" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/70">
                    Likes
                  </p>
                </div>
                <p className="mt-0.5 text-lg font-semibold leading-tight">
                  {listingLikesCount}
                </p>
              </div>
            </div>

            {/* RIGHT: Direct Message + Experiences / Reviews switcher */}
            <div className="w-full md:flex-1 flex flex-col md:flex-row md:items-center md:justify-end md:gap-3">
              {/* Direct Message — to the left of the switch on desktop */}
              <div className="w-full md:w-auto flex justify-center md:justify-end">
                <button
                  onClick={handleContactHost}
                  className="w-full md:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg:white text-neutral-900 shadow-md tracking-[0.14em] text-[11px] sm:text-xs font-semibold hover:shadow-lg transition text-center"
                  title="Direct Message"
                >
                  SAY HELLO
                </button>
              </div>

              {/* Experiences / Reviews switcher */}
              <div className="w-full md:w-auto flex justify-center md:justify-end">
                <div className="flex w-full md:w-auto rounded-full bg-neutral-50 p-1">
                  {(['experiences', 'reviews'] as TabKey[]).map((tab) => {
                    const reviewCount = reviews.length;
                    const reviewLabel =
                      reviewCount === 0 ? 'Reviews'
                      : reviewCount === 1 ? '1 Review'
                      : `${reviewCount} Reviews`;

                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => handleTabChange(tab)}
                        className={twMerge(
                          'relative flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-2 justify-center text-center',
                          activeTab === tab
                            ? 'bg-neutral-900 text-white shadow'
                            : 'text-neutral-600 hover:text-neutral-900'
                        )}
                      >
                        {tab === 'experiences' && activeTab === 'experiences' && (
                          <div className="relative flex items-center justify-center">
                            <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-md" />
                          </div>
                        )}
                        {tab === 'experiences' ? 'Experiences' : reviewLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
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
                    className="mt-4 grid gap-5 md:grid-cols-2"
                  >
                    {listings.length === 0 && (
                      <div className="col-span-full rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                        This host has no live experiences just yet.
                      </div>
                    )}

                    {listings.map((listing) => (
                      <Link
                          key={listing.id}
                          href={pathForListing(listing)}
                          className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-lg"
                        >
                        <div className="relative h-48">
                          {listing.imageSrc?.[0] ? (
                            <NextImage
                              src={listing.imageSrc?.[0] as string}
                              alt={listing.title}
                              fill
                              loading="lazy"
                              decoding="async"
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
                            {listing.locationValue && (() => {
                              const loc = getByValue(listing.locationValue);
                              if (!loc) return null;

                              const countryName = loc.label;            // e.g. "Italy"
                              const cityName = loc.city?.trim();        // e.g. "Milan"

                              return (
                                <div className="flex items-center gap-1 text-neutral-500 text-xs">
                                  <CountryFlagByLabel
                                    label={countryName}
                                    className="rounded-sm aspect-square mr-1.5 h-4 w-6 object-cover rounded"
                                  />
                                  <span className="uppercase tracking-widest">
                                    {cityName ? `${cityName}, ${countryName}` : countryName}
                                  </span>
                                </div>
                              );
                            })()}
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

                    {reviews.slice(0, visibleReviews).map((review) => {
                      const avatarSrc = getReviewAvatarSrc(review);
                      const initial = (review.reviewerName?.[0] || 'U').toUpperCase();

                      return (
                        <div key={review.id} className="rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition p-5 sm:p-6 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {avatarSrc ? (
                                <Avatar src={avatarSrc} name={review.reviewerName} size={36} />
                              ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold bg-neutral-900">
                                  {initial}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-neutral-900">{review.reviewerName}</p>
                                <p className="text-xs text-neutral-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* stars */}
                            <div className="flex flex-col text-center gap-1">
                              <span
                                className={clsx(
                                  'rounded-full px-3 py-1 text-xs font-semibold',
                                  ratingBadgeClasses(review.rating),
                                )}
                              >
                                {ratingLabel(review.rating)}
                              </span>

                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${i <= review.rating ? 'text-black' : 'text-neutral-300'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>

                        </div>

                        {/* listing title */}
                        <p className="text-sm font-medium text-neutral-700">{review.listingTitle}</p>

                        {/* comment */}
                        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                          {review.comment}
                        </p>
                      </div>
                    );
                  })}

                    {visibleReviews < reviews.length && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => setVisibleReviews((n) => Math.min(n + 5, reviews.length))}
                          className="text-sm px-4 py-2 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-white shadow-sm"
                        >
                          Show more reviews ({reviews.length - visibleReviews} left)
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {isCropping && uploadedImage && cropTarget && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="w-[92vw] max-w-[1000px] h-[68vh] relative rounded-xl shadow-lg">
              <Cropper
                image={uploadedImage}
                crop={crop}
                zoom={zoom}
                aspect={cropTarget === 'avatar' ? 1 : 16 / 9}
                cropShape={cropTarget === 'avatar' ? 'round' : 'rect'}
                showGrid={cropTarget !== 'avatar'}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleCropSubmit}
                className="px-6 py-2 bg-[#000] text-white rounded-xl hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={handleCropCancel}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
  );
};

export default HostCardClient;