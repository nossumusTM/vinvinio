'use client';

import { useRef, useState, useEffect, useMemo, useCallback, type FormEvent } from "react";
import { SafeUser } from "@/app/(marketplace)/types";
import Container from "@/app/(marketplace)/components/Container";
import Heading from "@/app/(marketplace)/components/Heading";
import PartnershipCommision from "@/app/(marketplace)/components/PartnershipCommision";
import PaymentConfetti from "../components/PaymentConfetti";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import CryptoJS from 'crypto-js';
import axios from "axios";
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/app/(marketplace)/utils/cropImage';
import CountrySelect from "../components/inputs/CountrySelect";
import { CountrySelectValue } from "@/app/(marketplace)/components/inputs/CountrySelect";
import AnimatedModal from "../components/modals/AnimatedModal";
import { AnimatePresence, motion, type Variants, type Easing } from 'framer-motion';
import { TbUserCircle, TbLock, TbCreditCard } from "react-icons/tb";
import { CgUserlane } from "react-icons/cg";
import { MdOutlineSecurity } from "react-icons/md";
import { RiSecurePaymentLine } from "react-icons/ri";
import ConfirmPopup from "../components/ConfirmPopup";
import EarningsCard from "../components/EarnigsCard";
import { Switch } from '@headlessui/react';
import { FiInfo, FiMail, FiPhone } from "react-icons/fi";
import FAQ from "../components/FAQ";
import toast from "react-hot-toast";
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';

import useLocaleSettings from '@/app/(marketplace)/hooks/useLocaleSettings';
import PayoutHistory, { PayoutRecord } from "../components/PayoutHistory";
import { slugSegment } from '@/app/(marketplace)/libs/links';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Avatar from "../components/Avatar";
import NextImage from 'next/image';
import CoverImageUploader from "../components/CoverImageUploader";
import { HiMiniArrowLeft } from 'react-icons/hi2';
import {
  MAX_PARTNER_COMMISSION,
  MAX_PARTNER_POINT_VALUE,
  MIN_PARTNER_COMMISSION,
  computeHostShareFromCommission,
  getPuntiLabel,
} from "@/app/(marketplace)/constants/partner";
import { BASE_CURRENCY } from "@/app/(marketplace)/constants/locale";

import VerificationBadge from "../components/VerificationBadge";
import { maskPhoneNumber } from "@/app/(marketplace)/utils/phone";
import { useSearchParams } from "next/navigation";
import { TbWorldUpload } from "react-icons/tb";
import { AggregateEntry, summarizeEntries } from "@/app/(marketplace)/libs/aggregateTotals";
import FilterHostAnalytics, { HostAnalyticsFilter } from "../components/FilterHostAnalytics";
import FilterPromoterAnalytics from "../components/FilterPromoterAnalytics";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Counter from "../components/inputs/Counter";
import Modal from "../components/modals/Modal";
import { SiJsonwebtokens } from "react-icons/si";
import { HiCheckCircle } from "react-icons/hi2";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

type PromoterAnalyticsState = {
  totalBooks: number;
  qrScans: number;
  totalRevenue: number;
  partnerCommission: number;
  punti: number;
  puntiShare: number;
  puntiLabel: string;
  breakdown: AggregateBuckets;
};

type VinvinPaymentFormProps = {
  clientSecret: string;
  amountLabel: string;
  onSuccess: () => Promise<void> | void;
  onError: (message: string) => void;
  registerSubmit: (handler: () => Promise<void>) => void;
};

const VinvinPaymentForm: React.FC<VinvinPaymentFormProps> = ({
  clientSecret,
  amountLabel,
  onSuccess,
  onError,
  registerSubmit,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    setIsConfirming(false);
  }, [clientSecret]);

  useEffect(() => {
    registerSubmit(async () => {
      if (!stripe || !elements) {
        onError("Payment is still initializing. Please try again in a moment.");
        return;
      }

      setIsConfirming(true);

      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        setIsConfirming(false);
        onError(result.error.message ?? "Payment failed. Please check your card and try again.");
        return;
      }

      await onSuccess();
      setIsConfirming(false);
    });
  }, [elements, onError, onSuccess, registerSubmit, stripe]);

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <p className="text-xs text-neutral-500">
        You will be charged <span className="font-semibold text-neutral-700">{amountLabel}</span> to boost your vin point.
      </p>
      {isConfirming && (
        <p className="text-xs text-indigo-600">Confirming payment, please wait…</p>
      )}
    </div>
  );
};

interface ProfileClientProps {
  currentUser: SafeUser;
  referralBookings: {
    totalCount: number;
    totalAmount: number;
  };
}

interface EarningsEntry {
  date: string;
  amount: number;
  books?: number;
}

type HostAnalytics = {
  totalBooks: number;
  totalRevenue: number;
  partnerCommission: number;
  punti: number;
  puntiShare: number;
  puntiLabel: string;
  platformRelevance: number;
  payoutMethod?: string;
  payoutNumber?: string;
  userId?: string;
  breakdown?: AggregateBuckets;
  currency?: string;
  };

  type AggregateBuckets = {
    daily: AggregateEntry[];
    monthly: AggregateEntry[];
    yearly: AggregateEntry[];
};

interface PartnershipCommisionProps {
  punti: number;
  puntiShare: number;
  puntiLabel: string;
  partnerCommission: number;
  maxPointValue: number;
  minCommission?: number;
  maxCommission?: number;
  onCommissionChange?: (commission: number) => Promise<void> | void;
  loading?: boolean;
  currentUserEmail?: string;

  // parent controls VinVin modal
  onOpenVinvinModal?: (payload: {
    effectivePunti: number;
    maxPointValue: number;
    puntiShare: number;
  }) => void;
}

const DEFAULT_HOST_ANALYTICS: HostAnalytics = {
  totalBooks: 0,
  totalRevenue: 0,
  partnerCommission: MIN_PARTNER_COMMISSION,
  punti: 0,
  puntiShare: 0,
  puntiLabel: getPuntiLabel(0),
  platformRelevance: 0,
  payoutMethod: undefined,
  payoutNumber: undefined,
  userId: undefined,
  currency: BASE_CURRENCY,
  breakdown: {
    daily: [],
    monthly: [],
    yearly: [],
  },
};

const getRandomColor = () => {
  const colors = [
    'bg-[#08e2ff]'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const formatPuntiPercentage = (share: number | null | undefined) => {
  const safe = Math.max(0, Math.min(1, share ?? 0));
  return `${Math.round(safe * 100)}%`;
};

const ProfileClient: React.FC<ProfileClientProps> = ({
  currentUser,
  referralBookings,
}) => {
  const searchParams = useSearchParams();
  const { formatConverted, baseCurrency } = useCurrencyFormatter();
  const { currencySymbol } = useLocaleSettings();
  const suspensionDate = useMemo(() => {
    const raw = currentUser?.suspendedAt;
    if (!raw) return null;
    const parsed = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [currentUser?.suspendedAt]);
  const { totalCount, totalAmount } = referralBookings;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState(currentUser.image || '');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [showConfirmDeletePayout, setShowConfirmDeletePayout] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
  const [emailVerificationRequested, setEmailVerificationRequested] = useState(false);
  const [phoneVerificationRequested, setPhoneVerificationRequested] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(Boolean(currentUser?.phoneVerified));
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [confirmingPhoneCode, setConfirmingPhoneCode] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState<string | null>(null);
  const emailVerified = Boolean(currentUser?.emailVerified);

  const [viewRole, setViewRole] = useState<'customer' | 'host' | 'promoter' | 'moder'>(currentUser.role);
  const [roleUpdating, setRoleUpdating] = useState(false);

  // --- OWNER & MEDIA STATE ---
const [isOwner, setIsOwner] = useState(false);

const avatarInputRef = useRef<HTMLInputElement | null>(null);
const coverInputRef  = useRef<HTMLInputElement | null>(null);

const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
const [coverPreview,  setCoverPreview]  = useState<string | null>(null);
const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
const [coverLoaded,   setCoverLoaded]   = useState(false);

const [uploadingAvatar, setUploadingAvatar] = useState(false);
const [uploadingCover,  setUploadingCover]  = useState(false);

const [hasMounted, setHasMounted] = useState(false);

const busy = uploadingAvatar || uploadingCover;

 
const [hostAnalytics, setHostAnalytics] = useState<HostAnalytics | null>(null);
const effectiveHostAnalytics = hostAnalytics ?? DEFAULT_HOST_ANALYTICS;
const hostCurrency = effectiveHostAnalytics.currency ?? baseCurrency;
const [hostBreakdown, setHostBreakdown] = useState<AggregateBuckets>(DEFAULT_HOST_ANALYTICS.breakdown!);
const [hostActivityFilter, setHostActivityFilter] = useState<HostAnalyticsFilter>('day');
const [hostActivityDate, setHostActivityDate] = useState<Date>(() => {
const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  });
const [promoterActivityFilter, setPromoterActivityFilter] = useState<'day' | 'month' | 'year'>('day');
const [promoterActivityDate, setPromoterActivityDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  });

// Who is paying
  const currentUserEmail = currentUser?.email ?? undefined;

  // VinVin modal state: where the numbers come from
  const [isVinvinModalOpen, setIsVinvinModalOpen] = useState(false);
  const [vinvinContext, setVinvinContext] = useState<{
    effectivePunti: number;
    maxPointValue: number;
    puntiShare: number;
  } | null>(null);

  // Derived values used everywhere in the VinVin flow
  const effectivePunti =
    vinvinContext?.effectivePunti ?? effectiveHostAnalytics.punti ?? 0;

  const maxPointValue =
    vinvinContext?.maxPointValue ?? MAX_PARTNER_POINT_VALUE;

  const effectiveShare =
    vinvinContext?.puntiShare ?? effectiveHostAnalytics.puntiShare ?? 0;

const [vinvinStep, setVinvinStep] = useState<"info" | "amount" | "payment">("info");
const [vinvinScoreTarget, setVinvinScoreTarget] = useState(() =>
  Math.max(1, Math.round(effectivePunti || 1))
);
const [clientSecret, setClientSecret] = useState<string | null>(null);
const [vinvinError, setVinvinError] = useState<string | null>(null);
const [isProcessingPayment, setIsProcessingPayment] = useState(false);
const paymentSubmitRef = useRef<(() => Promise<void>) | null>(null);

const [vinvinSuccess, setVinvinSuccess] = useState(false);
const [vinvinCountdown, setVinvinCountdown] = useState(20);

// keep score target aligned when base effective punti changes
useEffect(() => {
  setVinvinScoreTarget((prev) => {
    const min = Math.max(1, Math.round(effectivePunti || 1));
    return prev < min ? min : prev;
  });
}, [effectivePunti]);

  const resetVinvinFlow = useCallback(() => {
  setVinvinStep("info");
  setVinvinError(null);
  setClientSecret(null);
  setIsProcessingPayment(false);
  setVinvinSuccess(false);
  setVinvinCountdown(20);
}, []);

const openVinvinModal = useCallback(
  (payload?: { effectivePunti: number; maxPointValue: number; puntiShare: number }) => {
    const basePayload = {
      effectivePunti: effectiveHostAnalytics.punti ?? 0,
      maxPointValue: MAX_PARTNER_POINT_VALUE,
      puntiShare: effectiveHostAnalytics.puntiShare ?? 0,
    };

    const finalPayload = payload ?? basePayload;

    setVinvinContext(finalPayload);
    resetVinvinFlow();
    setVinvinScoreTarget(Math.max(1, Math.round(finalPayload.effectivePunti || 1)));
    setIsVinvinModalOpen(true);
  },
  [effectiveHostAnalytics.punti, effectiveHostAnalytics.puntiShare, resetVinvinFlow],
);

const handleVinvinClose = useCallback(() => {
  resetVinvinFlow();
  setIsVinvinModalOpen(false);
}, [resetVinvinFlow]);

  const registerPaymentSubmit = useCallback((handler: () => Promise<void>) => {
    paymentSubmitRef.current = handler;
  }, []);

  const handlePaymentSuccess = useCallback(async () => {
  try {
    await axios.post("/api/analytics/host/vinvin-score", { vinvinScore: vinvinScoreTarget });
    setVinvinError(null);
    setVinvinSuccess(true);
    setVinvinCountdown(20); // reset countdown
  } catch (error) {
    console.error("Failed to persist vin point", error);
    setVinvinError(
      "Payment succeeded but updating your vin point failed. Please refresh your profile."
    );
  } finally {
    setIsProcessingPayment(false);
  }
}, [vinvinScoreTarget]);

const handleBackToVinvinAmount = useCallback(() => {
  // Don’t allow going back while payment is processing or after success
  if (isProcessingPayment || vinvinSuccess) return;

  setVinvinStep("amount");
  setVinvinError(null);
  // you can keep vinvinScoreTarget as-is so user doesn’t lose their chosen value
}, [isProcessingPayment, vinvinSuccess]);

const handleBackToVinvinInfo = useCallback(() => {
  if (isProcessingPayment || vinvinSuccess) return;
  setVinvinStep("info");
  setVinvinError(null);
}, [isProcessingPayment, vinvinSuccess]);

useEffect(() => {
  if (!vinvinSuccess) return;

  if (vinvinCountdown <= 0) {
    window.location.href = "/profile";
    return;
  }

  const timer = setTimeout(() => {
    setVinvinCountdown((prev) => prev - 1);
  }, 1000);

  return () => clearTimeout(timer);
}, [vinvinSuccess, vinvinCountdown]);

  const vinvinPurchaseAmount = Math.max(0, vinvinScoreTarget - effectivePunti);

  const formattedVinvinAmount = useMemo(
    () =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(vinvinPurchaseAmount),
    [vinvinPurchaseAmount],
  );

  const handlePaymentError = useCallback((message: string) => {
    setVinvinError(message);
    setIsProcessingPayment(false);
  }, []);

  const handleVinvinAction = useCallback(async () => {
    // STEP 1 → STEP 2 (info → amount)
    if (vinvinStep === "info") {
      setVinvinError(null);
      setVinvinStep("amount");
      return;
    }

    // STEP 2 → STEP 3 (amount → payment intent)
    if (vinvinStep === "amount") {
      if (vinvinPurchaseAmount <= 0) {
        setVinvinError("Increase your vin point to proceed with payment.");
        return;
      }

      try {
        setIsProcessingPayment(true);
        const response = await axios.post("/api/create-payment-intent", {
          amount: vinvinPurchaseAmount * 100, // cents
          email: currentUserEmail,
        });

        setClientSecret(response.data.clientSecret);
        setVinvinStep("payment");
        setVinvinError(null);
        setIsProcessingPayment(false);
      } catch (error) {
        console.error("Failed to start VinVin payment", error);
        setVinvinError("Unable to start payment. Please check your connection and try again.");
        setIsProcessingPayment(false);
      }
      return;
    }

    // STEP 3: trigger Stripe confirm
    if (vinvinStep === "payment") {
      if (paymentSubmitRef.current) {
        setVinvinError(null);
        setIsProcessingPayment(true);
        await paymentSubmitRef.current();
      } else {
        setVinvinError("Payment form is not ready yet. Please wait a moment.");
      }
    }
  }, [vinvinStep, vinvinPurchaseAmount, currentUserEmail, paymentSubmitRef, axios]);

    const vinvinRelevance = Math.min(
    100,
    Math.round((vinvinScoreTarget / maxPointValue) * 100),
  );

  const vinvinModalBody = (
    <AnimatePresence mode="wait" initial={false}>
      {vinvinStep === "info" && (
        <motion.div
          key="vinvin-info"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
         {/* STEP BADGE ROW */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            <button
              type="button"
              onClick={() => setVinvinStep("info")}
              className="rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-semibold text-white"
            >
              1 · OVERVIEW
            </button>
            <button
              type="button"
              onClick={() => setVinvinStep("amount")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              2 · CHOOSE AMOUNT
            </button>
            <button
              type="button"
              onClick={() => clientSecret && setVinvinStep("payment")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-400 hover:bg-neutral-200 transition disabled:opacity-50"
              disabled={!clientSecret}
            >
              3 · CHECKOUT
            </button>
          </div>

          {/* STEP 1 · INFO ABOUT VINVIN */}
          <div className="rounded-3xl bg-transparent p-6 shadow-lg">
            <div className="flex flex-col items-center text-center gap-4">

              {/* Icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-md">
                <SiJsonwebtokens size={30} />
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold tracking-tight text-neutral-900">
                What is the vin point?
              </h3>

              {/* Description */}
              <p className="text-start text-[13px] leading-relaxed text-neutral-600 max-w-sm">
                VinVin is your listing&apos;s relevance score powered by our AI ranking model.
                It’s independent from whether you use a partnership commission or a subscription,
                and reflects{" "}
                <span className="font-semibold text-neutral-900">
                  how useful and attractive your experience is for travellers.
                </span>
              </p>

              <p className="text-start text-[13px] leading-relaxed text-neutral-600 max-w-sm">
                Higher vin points help your listings appear{" "}
                <span className="font-semibold text-neutral-900">
                  ahead of similar-rated experiences
                </span>{" "}
                and unlock access to the{" "}
                <span className="font-semibold text-indigo-600">VinVin AI Whitelist</span>,
                which boosts your relevance across the entire platform.
              </p>
            </div>
          </div>

        </motion.div>
      )}

      {vinvinStep === "amount" && (
        <motion.div
          key="vinvin-amount"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* STEP BADGE ROW */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            <button
              type="button"
              onClick={() => setVinvinStep("info")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              1 · OVERVIEW
            </button>
            <button
              type="button"
              onClick={() => setVinvinStep("amount")}
              className="rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-semibold text-white"
            >
              2 · CHOOSE AMOUNT
            </button>
            <button
              type="button"
              onClick={() => clientSecret && setVinvinStep("payment")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-400 hover:bg-neutral-200 transition disabled:opacity-50"
              disabled={!clientSecret}
            >
              3 · CHECKOUT
            </button>
          </div>

          {/* STEP 2 · VINVIN SCORE SELECTION */}
          <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200/80">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-neutral-900">
                Choose how much to boost your vin point
              </h3>
              <p className="text-xs text-neutral-600">
                Each vin point point costs 1€ and increases the visibility of your listings in
                their category and rating group.
              </p>
            </div>

            <Counter
              title="Vin point boost"
              subtitle="Increase your visibility — max 111 points"
              value={vinvinScoreTarget}
              onChange={(value) =>
                setVinvinScoreTarget(
                  Math.max(
                    Math.round(effectivePunti || 1),
                    Math.min(maxPointValue, Math.max(1, value)),
                  ),
                )
              }
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-neutral-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-neutral-800">
                  <span>VinVin score after purchase</span>
                  <span>
                    {vinvinScoreTarget} / {maxPointValue}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-700">
                  <span>Estimated platform relevance</span>
                  <span>{vinvinRelevance}%</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Closer to <span className="font-semibold">100%</span> means your listing will sit
                  among the most relevant experiences in its segment.
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-neutral-700">
                  <span>Current VinVin score</span>
                  <span className="font-semibold text-neutral-900">
                    {effectivePunti} / {maxPointValue}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-neutral-700">
                  <span>Current platform relevance</span>
                  <span className="font-semibold text-neutral-900">
                    {formatPuntiPercentage(effectiveShare)}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Your VinVin score interacts with our recommendation algorithm to position you
                  among experiences with similar ratings but higher relevance.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-neutral-900 p-4 text-white shadow-sm">
              <div>
                <p className="text-sm font-semibold">Total to pay</p>
                <p className="text-[11px] text-neutral-200">1 VinVin score = 1€</p>
              </div>
              <p className="text-lg font-semibold">{formattedVinvinAmount}</p>
            </div>

            {vinvinError && <p className="text-sm text-red-600">{vinvinError}</p>}
          </div>
        </motion.div>
      )}

      {vinvinStep === "payment" && (
        <motion.div
          key="vinvin-payment"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* STEP BADGE ROW */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            <button
              type="button"
              onClick={() => setVinvinStep("info")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              1 · OVERVIEW
            </button>
            <button
              type="button"
              onClick={() => setVinvinStep("amount")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              2 · CHOOSE AMOUNT
            </button>
            <button
              type="button"
              onClick={() => setVinvinStep("payment")}
              className="rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-semibold text-white"
            >
              3 · CHECKOUT
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-neutral-900">
              {vinvinSuccess ? "" : "Confirm & Pay"}
            </h3>
            <p className="text-sm text-neutral-600">
              {vinvinSuccess
                ? ""
                : "Secure your preferred payment method to enhance your platform relevance."}
            </p>
          </div>

          {vinvinSuccess ? (
            <>
              <PaymentConfetti />

              <motion.div
                className="space-y-3 rounded-2xl p-4 flex flex-col items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45, opacity: 0 }}
                  animate={{
                    scale: [0, 1.2, 1],
                    rotate: [-45, 0, 0],
                    opacity: [0, 1, 1],
                  }}
                  transition={{
                    duration: 3,
                    ease: "easeOut",
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg"
                >
                  <HiCheckCircle className="h-8 w-8 text-white" />
                </motion.div>
                <p className="mt-2 text-center text-lg font-semibold tracking-wide text-emerald-900">
                  PAYMENT CONFIRMED!
                </p>
              </motion.div>
            </>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <VinvinPaymentForm
                clientSecret={clientSecret}
                amountLabel={formattedVinvinAmount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                registerSubmit={registerPaymentSubmit}
              />
            </Elements>
          ) : (
            <p className="text-sm text-neutral-600">Preparing payment details…</p>
          )}

          {vinvinError && (
            <p className="text-sm text-red-600">{vinvinError}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

 const vinvinActionLabel =
  vinvinSuccess
    ? `Redirecting in ${vinvinCountdown}s`
    : vinvinStep === "info"
      ? "Next"
      : vinvinStep === "amount"
        ? "Proceed to payment"
        : isProcessingPayment
          ? "Processing…"
          : `Pay ${formattedVinvinAmount}`;

useEffect(() => {
  setHasMounted(true);
}, []);

// --- OWNER RESOLUTION (profile == currentUser) ---
useEffect(() => {
  setIsOwner(Boolean(currentUser?.id));
}, [currentUser?.id]);

// --- FETCH COVER FROM API (optional, if you store cover separately) ---
useEffect(() => {
  let alive = true;
  (async () => {
    try {
      if (!currentUser?.id) return;
      const res = await fetch(`/api/users/cover?userId=${encodeURIComponent(currentUser.id)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (alive) setCoverImageUrl(data?.coverImage ?? null);
    } catch {}
  })();
  return () => { alive = false; };
}, [currentUser?.id]);

// --- FILE HELPERS ---
const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const pickAvatar = () => avatarInputRef.current?.click();
const pickCover  = () => coverInputRef.current?.click();

// --- UPLOAD HANDLERS (no crop; plug in your cropper if needed) ---
const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadingAvatar(true);
  try {
    const dataUrl = await fileToBase64(file);
    setAvatarPreview(dataUrl);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    await axios.put('/api/users/profile-image', { image: base64 });
  } catch (err) {
    console.error('Avatar upload failed', err);
  } finally {
    setUploadingAvatar(false);
    e.target.value = '';
  }
};

const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadingCover(true);
  try {
    const dataUrl = await fileToBase64(file);
    setCoverPreview(dataUrl);
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    await axios.put('/api/users/cover', { image: base64 });
  } catch (err) {
    console.error('Cover upload failed', err);
  } finally {
    setUploadingCover(false);
    e.target.value = '';
  }
};

// --- CHOOSE COVER IMAGE SOURCE ---
const coverImage = useMemo(() => {
  if (coverPreview)    return coverPreview;           // fresh local
  if (coverImageUrl)   return coverImageUrl;          // fetched from API
  if (currentUser?.coverImage) return currentUser.coverImage as string; // if stored on user
  return null;
}, [coverPreview, coverImageUrl, currentUser?.coverImage]);


  useEffect(() => {
    if (currentUser.role !== 'host') {
      setViewRole(currentUser.role);
    }
  }, [currentUser.role]);

  const EASE_BEZIER: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

  const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASE_BEZIER },
    },
  };

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: EASE_BEZIER },
    },
    exit: {
      opacity: 0,
      y: -14,
      transition: { duration: 0.25, ease: EASE_BEZIER },
    },
  };

  const canToggleRole = ['host', 'customer'].includes(currentUser.role);
  const isHostView = viewRole === 'host';
  const modeLabel = isHostView ? 'Host Mode' : 'Guest Mode';
  const modeGradient = isHostView
    ? 'from-indigo-500 via-sky-500 to-blue-500'
    : 'from-amber-400 via-orange-500 to-rose-500';
  const modeDescription = isHostView
    ? 'Manage listings, payouts and analytics without losing guest-facing data.'
    : 'Preview as a guest while we keep your host workspace untouched.';
    
  const paymentsTitle = viewRole === 'host' ? 'Payments & Withdrawals' : 'Payments & Vouchers';

  const lastPasswordUpdateDate = useMemo(
    () => (currentUser.passwordUpdatedAt ? new Date(currentUser.passwordUpdatedAt) : null),
    [currentUser.passwordUpdatedAt]
  );

  const lastRoleToastRef = useRef<'host' | 'customer' | null>(null);

  const handleRoleToggle = async (nextIsHost: boolean) => {
    if (!canToggleRole || roleUpdating) return;

    const target: 'host' | 'customer' = nextIsHost ? 'host' : 'customer';

    setRoleUpdating(true);

     try {
      const response = await axios.patch('/api/users/switch-role', {
        targetRole: target,
      });

      const updatedRole = (response?.data?.role as 'host' | 'customer' | undefined) ?? target;

      setViewRole((prev) => {
        if (prev === updatedRole) return prev;

      if (lastRoleToastRef.current !== updatedRole) {
          lastRoleToastRef.current = updatedRole;
          toast.success(`Switched to ${updatedRole === 'host' ? 'Host' : 'Guest'} mode`, {
            iconTheme: { primary: '#2200ffff', secondary: '#fff' },
          });
          setTimeout(() => {
            if (lastRoleToastRef.current === updatedRole) lastRoleToastRef.current = null;
          }, 400);

          window.location.reload();
        }

        return updatedRole;
      });
    } catch (error) {
      console.error('Failed to update role', error);
      toast.error('Unable to switch modes right now.');
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleEmailVerificationRequest = async () => {
    if (verifying || emailVerificationRequested) return;

    setVerifying(true);
    try {
      await axios.post('/api/users/request-email-verification');
      setEmailVerificationRequested(true);
      toast.success('Verification email sent!', {
        iconTheme: {
          primary: '#2200ffff',
          secondary: '#fff',
        },
      });
    } catch (err) {
      console.error('Failed to send verification email:', err);
      toast.error('Failed to send verification email.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePhoneVerificationRequest = async () => {
    if (phoneVerificationLoading) return;

    setPhoneVerificationLoading(true);
    try {
      const response = await axios.post('/api/users/request-phone-verification');

      if (response.status === 200) {
        const alreadyVerified = Boolean(response.data?.alreadyVerified);

        if (alreadyVerified) {
          setPhoneVerified(true);
          setPhoneVerificationRequested(false);
          toast.success('Your phone number is already verified.', {
            iconTheme: {
              primary: '#2200ffff',
              secondary: '#fff',
            },
          });
          return;
        }

        setPhoneVerificationRequested(true);
        setPhoneVerificationCode('');
        setPhoneVerificationError(null);
        toast.success('We\'ll text you shortly to verify your phone.', {
          iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('Failed to request phone verification:', error);
      toast.error('Could not start phone verification right now.');
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

  const handlePhoneCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCode = phoneVerificationCode.trim();
    if (!trimmedCode) {
      setPhoneVerificationError('Enter the verification code we sent you.');
      return;
    }

    setPhoneVerificationError(null);
    setConfirmingPhoneCode(true);
    try {
      const response = await axios.post('/api/users/confirm-phone-verification', {
        code: trimmedCode,
      });

      if (response.status === 200) {
        setPhoneVerified(true);
        setPhoneVerificationRequested(false);
        setPhoneVerificationCode('');
        toast.success('Phone number verified!', {
          iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('Failed to verify phone code:', error);
      const message = axios.isAxiosError(error) ? error.response?.data?.error : null;
      if (message) {
        toast.error(message);
      } else {
        toast.error('That code was not valid. Please try again.');
      }
    } finally {
      setConfirmingPhoneCode(false);
    }
  };

  const [earnings, setEarnings] = useState<{
    daily: EarningsEntry[];
    monthly: EarningsEntry[];
    yearly: EarningsEntry[];
    dailyProfit: number;
    todaysProfit: number;
    totalEarnings: number;
    currency: string;
    revenueTotals: Record<'daily' | 'monthly' | 'yearly' | 'all', number>;
  }>({
    daily: [],
    monthly: [],
    yearly: [],
    dailyProfit: 0,
    todaysProfit: 0,
    totalEarnings: 0,
    currency: BASE_CURRENCY,
    revenueTotals: {
    daily: 0,
    monthly: 0,
    yearly: 0,
    all: 0,
  },
  });  

  const [payoutRecords, setPayoutRecords] = useState<PayoutRecord[]>([]);
  const earningsCurrency = earnings.currency ?? baseCurrency;

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [initialSectionApplied, setInitialSectionApplied] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<{
    username: string;
    name: string;
    email: string;
    phone: string;
    contact: string;
    legalName: string;
    country: CountrySelectValue | null;
    street: string;
    apt: string;
    city: string;
    state: string;
    zip: string;
  }>({
    username: currentUser?.username || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    contact: currentUser?.contact || '',
    legalName: currentUser?.legalName || '',
    country: null,
    street: '',
    apt: '',
    city: '',
    state: '',
    zip: ''
  });  

  const [activePaymentTab, setActivePaymentTab] = useState<'payment' | 'payout'>('payment');
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [userCoupon, setUserCoupon] = useState<string | null>(null);

  const [savedCard, setSavedCard] = useState<any>(null);
  const [cardUpdated, setCardUpdated] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [payoutInfo, setPayoutInfo] = useState({
    method: 'card', // 'card' | 'iban' | 'paypal' | 'revolut'
    number: '',
  });  
  
  const [savedPayout, setSavedPayout] = useState<any>(null);
  const [payoutUpdated, setPayoutUpdated] = useState(false);
  const [showPayoutHistory, setShowPayoutHistory] = useState(false);

  const [cardType, setCardType] = useState('');
  const [cardInfo, setCardInfo] = useState<{
    number: string;
    name: string;
    address: string;
    apt: string;
    city: string;
    state: string;
    zip: string;
    method: string;
    country?: CountrySelectValue;
  }>({
    number: '',
    name: '',
    address: '',
    apt: '',
    city: '',
    state: '',
    zip: '',
    method: 'card',
  });

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [confirmDeactivation, setConfirmDeactivation] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');

  // const [analytics, setAnalytics] = useState({
  //   totalBooks: 0,
  //   qrScans: 0,
  //   totalRevenue: 0,
  //   partnerCommission: MIN_PARTNER_COMMISSION,
  //   punti: 0,
  //   puntiShare: 0,
  //   puntiLabel: getPuntiLabel(0),
  //   breakdown: {
  //     daily: [],
  //     monthly: [],
  //     yearly: [],
  //   },
  // });

  const [analytics, setAnalytics] = useState<PromoterAnalyticsState>({
    totalBooks: 0,
    qrScans: 0,
    totalRevenue: 0,
    partnerCommission: MIN_PARTNER_COMMISSION,
    punti: 0,
    puntiShare: 0,
    puntiLabel: getPuntiLabel(0),
    breakdown: {
      daily: [],
      monthly: [],
      yearly: [],
    },
  });

  const promoterBreakdown = useMemo<AggregateBuckets>(
    () =>
      analytics.breakdown ?? {
        daily: [],
        monthly: [],
        yearly: [],
      },
    [analytics.breakdown],
  );

  // const [hostAnalytics, setHostAnalytics] = useState({
  //   totalBooks: 0,
  //   totalRevenue: 0,
  // }); 

  useEffect(() => {
    if (initialSectionApplied) {
      return;
    }

    const section = searchParams?.get('section');
    const allowedSections = new Set(['personal-info', 'login-security', 'payments']);

    if (section && allowedSections.has(section)) {
      setActiveSection(section);
    }

    setInitialSectionApplied(true);
  }, [searchParams, initialSectionApplied]);

  const [updatingCommission, setUpdatingCommission] = useState(false);

  const commissionAdjustedEntries = useMemo(() => {
    const fallbackCommission =
      typeof currentUser.partnerCommission === 'number'
        ? currentUser.partnerCommission
        : MIN_PARTNER_COMMISSION;

    const applyCommission = (entries: AggregateEntry[]) => {
      return entries.map((entry) => {
        const commission = Number.isFinite(entry.commission)
          ? (entry.commission as number)
          : fallbackCommission; // 👈 use User.partnerCommission here

        const hostShare = computeHostShareFromCommission(commission);

        return {
          date: entry.period,
          amount: (entry.revenue ?? 0) * hostShare,
          books: entry.bookings ?? 0,
        } satisfies EarningsEntry;
      });
    };

    return {
      daily: applyCommission(hostBreakdown.daily),
      monthly: applyCommission(hostBreakdown.monthly),
      yearly: applyCommission(hostBreakdown.yearly),
    };
  }, [
    currentUser.partnerCommission,
    hostBreakdown.daily,
    hostBreakdown.monthly,
    hostBreakdown.yearly,
  ]);

  const selectPreferredEntry = useCallback((entries: AggregateEntry[]) => {
    return (
      entries.find((entry) => (entry.bookings ?? 0) > 0 || (entry.revenue ?? 0) > 0) ??
      entries[0] ??
      null
    );
  }, []);

  const resolveEntriesForFilter = useCallback(
    (breakdown: AggregateBuckets, filter: 'day' | 'month' | 'year') => {
      if (filter === 'month') return breakdown.monthly;
      if (filter === 'year') return breakdown.yearly;
      return breakdown.daily;
    },
    [],
  );

  const normalizePeriodKey = useCallback((period: string) => {
    const normalized = String(period ?? '').trim();

    const dayMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    const monthMatch = normalized.match(/^(\d{4})[-/](\d{1,2})/);
    const yearMatch = normalized.match(/^(\d{4})/);

    if (dayMatch) {
      const [, y, m, d] = dayMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    if (monthMatch) {
      const [, y, m] = monthMatch;
      return `${y}-${m.padStart(2, '0')}`;
    }

    if (yearMatch) {
      return yearMatch[1];
    }

    const parsed = new Date(normalized.includes('T') ? normalized : `${normalized}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getUTCFullYear();
      const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const day = String(parsed.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  }, []);

  const parsePeriodKeyParts = useCallback((key: string) => {
    const segments = key.split('-');

    if (!segments.length) return { year: null, month: null, day: null };

    const [yearRaw, monthRaw, dayRaw] = segments;

    const year = Number.isFinite(Number(yearRaw)) ? Number(yearRaw) : null;
    const month = Number.isFinite(Number(monthRaw)) ? Number(monthRaw) : null;
    const day = Number.isFinite(Number(dayRaw)) ? Number(dayRaw) : null;

    return { year, month, day };
  }, []);

  const toDateKeys = useCallback((date: Date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    return {
      year,
      month,
      day,
      dayKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      monthKey: `${year}-${String(month).padStart(2, '0')}`,
    };
  }, []);

  const parsePeriodToDate = useCallback(
    (period: string, filter: HostAnalyticsFilter) => {
      const key = normalizePeriodKey(period);

      const { year, month, day } = parsePeriodKeyParts(key);

      if (filter === 'day' && year && month && day) {
        return new Date(Date.UTC(year, month - 1, day));
      }

      if (filter === 'month' && year && month) {
        return new Date(Date.UTC(year, month - 1, 1));
      }

      if (year) {
        return new Date(Date.UTC(year, 0, 1));
      }

      const fallback = new Date();
        return new Date(
                Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()),
              );
    },
    [normalizePeriodKey, parsePeriodKeyParts],
  );

  const computeYearOptions = useCallback(
    (breakdown: AggregateBuckets) => {
      const years = new Set<number>();

      const addYear = (entry: AggregateEntry) => {
        const { year } = parsePeriodKeyParts(normalizePeriodKey(entry.period));
        if (year) years.add(year);
      };

      breakdown.daily.forEach(addYear);
      breakdown.monthly.forEach(addYear);
      breakdown.yearly.forEach(addYear);

      const ordered = Array.from(years).sort((a, b) => a - b);

      if (!ordered.length) {
        const now = new Date();
        return [now.getUTCFullYear()];
      }

      return ordered;
    },
    [normalizePeriodKey, parsePeriodKeyParts],
  );

  const hostYearOptions = useMemo(
    () => computeYearOptions(hostBreakdown),
    [computeYearOptions, hostBreakdown],
  );

  const promoterYearOptions = useMemo(
    () => computeYearOptions(promoterBreakdown),
    [computeYearOptions, promoterBreakdown],
  );

  const normalizePeriodToDate = useCallback((period: string) => {
    const normalized = String(period ?? '').trim();

    const dayMatch = normalized.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    const monthMatch = normalized.match(/^(\d{4})[-/](\d{1,2})/);
    const yearMatch = normalized.match(/^(\d{4})/);

    if (dayMatch) {
      const [, y, m, d] = dayMatch;
      return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    }

    if (monthMatch) {
      const [, y, m] = monthMatch;
      return new Date(Date.UTC(Number(y), Number(m) - 1, 1));
    }

    if (yearMatch) {
      return new Date(Date.UTC(Number(yearMatch[1]), 0, 1));
    }

    const parsed = new Date(normalized.includes('T') ? normalized : `${normalized}T00:00:00Z`);
    return Number.isNaN(parsed.getTime())
      ? null
      : new Date(
          Date.UTC(
            parsed.getUTCFullYear(),
            parsed.getUTCMonth(),
            parsed.getUTCDate(),
          ),
        );
    }, []);
  
  const matchesPeriod = useCallback(
    (period: string, filter: HostAnalyticsFilter, targetDate: Date | null) => {
      if (!targetDate) return false;

      const key = normalizePeriodKey(period);
      if (!key) return false;

      const entryParts = parsePeriodKeyParts(key);
      const targetParts = toDateKeys(targetDate);

      if (filter === 'day') {
        return (
          entryParts.year === targetParts.year &&
          entryParts.month === targetParts.month &&
          entryParts.day === targetParts.day
        );
      }

      if (filter === 'month') {
        return entryParts.year === targetParts.year && entryParts.month === targetParts.month;
      }

      return entryParts.year === targetParts.year;
    },
    [normalizePeriodKey, parsePeriodKeyParts, toDateKeys],
  );

  const handleHostFilterChange = useCallback(
    (nextFilter: HostAnalyticsFilter) => {
      setHostActivityFilter(nextFilter);

      const candidates = resolveEntriesForFilter(hostBreakdown, nextFilter);
      const preferred = selectPreferredEntry(candidates);

      if (!preferred) return;

      const nextDate = parsePeriodToDate(preferred.period, nextFilter);
      if (!Number.isNaN(nextDate.getTime())) {
        setHostActivityDate(nextDate);
      }
    },
    [hostBreakdown, parsePeriodToDate, resolveEntriesForFilter, selectPreferredEntry],
  );

  const handlePromoterFilterChange = useCallback(
    (nextFilter: 'day' | 'month' | 'year') => {
      setPromoterActivityFilter(nextFilter);

      const candidates = resolveEntriesForFilter(promoterBreakdown, nextFilter);
      const preferred = selectPreferredEntry(candidates);

      if (!preferred) return;

      const nextDate = parsePeriodToDate(preferred.period, nextFilter);
      if (!Number.isNaN(nextDate.getTime())) {
        setPromoterActivityDate(nextDate);
      }
    },
    [parsePeriodToDate, promoterBreakdown, resolveEntriesForFilter, selectPreferredEntry],
  );

  const hostPeriodKey = useMemo(() => {
    const date = hostActivityDate ?? new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    if (hostActivityFilter === 'day') return `${year}-${month}-${day}`;
    if (hostActivityFilter === 'month') return `${year}-${month}`;
    return `${year}`;
  }, [hostActivityDate, hostActivityFilter]);

  const promoterPeriodKey = useMemo(() => {
    const date = promoterActivityDate ?? new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    if (promoterActivityFilter === 'day') return `${year}-${month}-${day}`;
    if (promoterActivityFilter === 'month') return `${year}-${month}`;
    return `${year}`;
  }, [promoterActivityDate, promoterActivityFilter]);

  const hostFilteredEntries = useMemo(() => {
    const primaryEntries = resolveEntriesForFilter(hostBreakdown, hostActivityFilter);

    let candidates = primaryEntries;
    if (!candidates.length) {
      if (hostActivityFilter === 'month') {
        candidates = hostBreakdown.monthly.length ? hostBreakdown.monthly : hostBreakdown.daily;
      } else if (hostActivityFilter === 'year') {
        candidates =
          hostBreakdown.yearly.length
            ? hostBreakdown.yearly
            : hostBreakdown.monthly.length
            ? hostBreakdown.monthly
            : hostBreakdown.daily;
      }
    }

    return candidates.filter((entry) => matchesPeriod(entry.period, hostActivityFilter, hostActivityDate));
  }, [hostActivityDate, hostActivityFilter, hostBreakdown, matchesPeriod, resolveEntriesForFilter, selectPreferredEntry]);

  // useEffect(() => {
  //   // const date = hostActivityDate ?? new Date();
  //   // const year = date.getUTCFullYear();
  //   // const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  //   // const day = String(date.getUTCDate()).padStart(2, '0');

  //   // const hostPeriodKey =
  //   //   hostActivityFilter === 'day'
  //   //     ? `${year}-${month}-${day}`
  //   //     : hostActivityFilter === 'month'
  //   //     ? `${year}-${month}`
  //   //     : `${year}`;

  //   const entries = resolveEntriesForFilter(hostBreakdown, hostActivityFilter);

  //   const candidateEntries =
  //     entries.length || hostActivityFilter === 'day'
  //       ? entries
  //       : hostActivityFilter === 'month'
  //       ? hostBreakdown.monthly.length
  //         ? hostBreakdown.monthly
  //         : hostBreakdown.daily
  //       : hostBreakdown.yearly.length
  //       ? hostBreakdown.yearly
  //       : hostBreakdown.monthly.length
  //       ? hostBreakdown.monthly
  //       : hostBreakdown.daily;

  //   if (!candidateEntries.length) return;

  //   const hasMatch = candidateEntries.some((entry) =>
  //     // matchesPeriod(entry.period, hostActivityFilter, hostPeriodKey),
  //     matchesPeriod(entry.period, hostActivityFilter, hostActivityDate),
  //   );

  //   // if (hasMatch && matchesPeriod(preferred.period, hostActivityFilter, hostPeriodKey)) return;
  //   if (hasMatch || hostActivityFilter === 'day') return;

  //   const preferred = selectPreferredEntry(candidateEntries);
  //   if (!preferred) return;

  //   // const preferred = selectPreferredEntry(candidateEntries);
  //   // if (!preferred) return;

  //   const nextDate = parsePeriodToDate(preferred.period ?? '', hostActivityFilter);
  //   if (!Number.isNaN(nextDate.getTime())) {
  //     setHostActivityDate(nextDate);
  //   }
  // }, [
  //   hostActivityDate,
  //   hostBreakdown,
  //   hostActivityFilter,
  //   matchesPeriod,
  //   parsePeriodToDate,
  //   resolveEntriesForFilter,
  //   selectPreferredEntry,
  // ]);

  useEffect(() => {
    setHostActivityDate((prevDate) => {
      const entries = resolveEntriesForFilter(hostBreakdown, hostActivityFilter);

      const candidateEntries =
        entries.length || hostActivityFilter === 'day'
          ? entries
          : hostActivityFilter === 'month'
          ? hostBreakdown.monthly.length
            ? hostBreakdown.monthly
            : hostBreakdown.daily
          : hostBreakdown.yearly.length
          ? hostBreakdown.yearly
          : hostBreakdown.monthly.length
          ? hostBreakdown.monthly
          : hostBreakdown.daily;

      if (!candidateEntries.length) return prevDate;

      const hasMatch = candidateEntries.some((entry) =>
        matchesPeriod(entry.period, hostActivityFilter, prevDate),
      );

      // If current date already matches some entry (or we’re in day mode),
      // keep user selection as-is.
      if (hasMatch || hostActivityFilter === 'day') return prevDate;

      const preferred = selectPreferredEntry(candidateEntries);
      if (!preferred) return prevDate;

      const nextDate = parsePeriodToDate(preferred.period ?? '', hostActivityFilter);
      return Number.isNaN(nextDate.getTime()) ? prevDate : nextDate;
    });
  }, [
    hostBreakdown,
    hostActivityFilter,
    matchesPeriod,
    parsePeriodToDate,
    resolveEntriesForFilter,
    selectPreferredEntry,
  ]);

  useEffect(() => {
    setPromoterActivityDate((prevDate) => {
      const entries = resolveEntriesForFilter(promoterBreakdown, promoterActivityFilter);

      const candidateEntries =
        entries.length || promoterActivityFilter === 'day'
          ? entries
          : promoterActivityFilter === 'month'
          ? promoterBreakdown.monthly.length
            ? promoterBreakdown.monthly
            : promoterBreakdown.daily
          : promoterBreakdown.yearly.length
          ? promoterBreakdown.yearly
          : promoterBreakdown.monthly.length
          ? promoterBreakdown.monthly
          : promoterBreakdown.daily;

      if (!candidateEntries.length) return prevDate;

      const hasMatch = candidateEntries.some((entry) =>
        matchesPeriod(entry.period, promoterActivityFilter, prevDate),
      );

      if (hasMatch || promoterActivityFilter === 'day') return prevDate;

      const preferred = selectPreferredEntry(candidateEntries);
      if (!preferred) return prevDate;

      const nextDate = parsePeriodToDate(preferred.period ?? '', promoterActivityFilter);
      return Number.isNaN(nextDate.getTime()) ? prevDate : nextDate;
    });
  }, [
    matchesPeriod,
    parsePeriodToDate,
    promoterActivityFilter,
    promoterBreakdown,
    resolveEntriesForFilter,
    selectPreferredEntry,
  ]);

  const hostActivityTotals = useMemo(
    () => summarizeEntries(hostFilteredEntries),
    [hostFilteredEntries],
  );

  const hostFilterLabel = useMemo(() => {
    const date = hostActivityDate ?? new Date();

    if (hostActivityFilter === 'day') {
      return new Intl.DateTimeFormat('en', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    }

    if (hostActivityFilter === 'month') {
      return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
    }

    return String(date.getUTCFullYear());
  }, [hostActivityDate, hostActivityFilter]);

  const normalizeCommissionValue = useCallback((value?: number) => {
    return Number.isFinite(value) && (value as number) > 0 ? (value as number) : undefined;
  }, []);

  const hostCommissionForFilter = useMemo(() => {
    const matchingEntry = hostFilteredEntries.find((entry) =>
      matchesPeriod(entry.period, hostActivityFilter, hostActivityDate),
    );

    const normalizedMatching = normalizeCommissionValue(matchingEntry?.commission);
    if (normalizedMatching != null) {
      return normalizedMatching;
    }

    const normalizedTotals = normalizeCommissionValue(hostActivityTotals.commission);
    if (normalizedTotals != null) {
      return normalizedTotals;
    }

    return normalizeCommissionValue(effectiveHostAnalytics.partnerCommission);
  }, [
    effectiveHostAnalytics.partnerCommission,
    hostActivityFilter,
    hostActivityTotals.commission,
    hostFilteredEntries,
    hostPeriodKey,
    matchesPeriod,
    normalizeCommissionValue,
  ]);

  // share for the label & EarningsCard
  const hostRevenueShare = useMemo(() => {
    const commission = effectiveHostAnalytics.partnerCommission ?? 0;
    const clamped = Math.max(0, Math.min(100, commission));
    return (100 - clamped) / 100;
  }, [effectiveHostAnalytics.partnerCommission]);

  // share used when we have to reconstruct revenue from raw totals:
  const hostPreWithdrawalValue = useMemo(() => {
    const revenue = hostActivityTotals.revenue ?? 0;

    const hasCommissionedEntries =
      hostFilteredEntries.some((entry) => normalizeCommissionValue(entry.commission) != null) ||
      normalizeCommissionValue(hostActivityTotals.commission) != null;

    if (hasCommissionedEntries) {
      // breakdown already has per-booking commission baked in
      return revenue;
    }

    const commissionForPeriod = hostCommissionForFilter ?? effectiveHostAnalytics.partnerCommission;
    const clamped = Math.max(0, Math.min(100, commissionForPeriod ?? 0));
    const hostShare = (100 - clamped) / 100;

    return revenue * hostShare;
  }, [
    effectiveHostAnalytics.partnerCommission,
    hostActivityTotals.commission,
    hostActivityTotals.revenue,
    hostCommissionForFilter,
    hostFilteredEntries,
    normalizeCommissionValue,
  ]);

  const promoterEntriesForFilter = useMemo(
    () => resolveEntriesForFilter(promoterBreakdown, promoterActivityFilter),
    [promoterBreakdown, promoterActivityFilter, resolveEntriesForFilter],
  );

  const promoterFilteredEntries = useMemo(() => {
    return promoterEntriesForFilter.filter((entry) =>
      matchesPeriod(entry.period, promoterActivityFilter, promoterActivityDate),
    );
  }, [matchesPeriod, promoterActivityDate, promoterActivityFilter, promoterEntriesForFilter]);

  const promoterActivityTotals = useMemo(
    () => summarizeEntries(promoterFilteredEntries),
    [promoterFilteredEntries],
  );

  const promoterActivityQrScans = useMemo(
    () =>
      promoterFilteredEntries.reduce(
        (sum, entry: any) => sum + (entry?.qrScans ?? 0),
        0,
      ),
    [promoterFilteredEntries],
  );

  const normalizeBreakdown = useCallback((raw: any, granularity?: 'day' | 'month' | 'year'): AggregateBuckets => {
    // 1) Already in { daily, monthly, yearly } form
    if (raw && (raw.daily || raw.monthly || raw.yearly)) {
      return {
        daily: normalizeEntries(raw.daily ?? [], 'daily'),
        monthly: normalizeEntries(raw.monthly ?? [], 'monthly'),
        yearly: normalizeEntries(raw.yearly ?? [], 'yearly'),
      };
    }

    // 2) Flat array (API already filtered by granularity)
    if (Array.isArray(raw)) {
      const mode: 'day' | 'month' | 'year' = granularity ?? 'day';
      const normalized = normalizeEntries(raw, mode === 'day' ? 'daily' : mode === 'month' ? 'monthly' : 'yearly');

      return {
        daily: mode === 'day' ? normalized : [],
        monthly: mode === 'month' ? normalized : [],
        yearly: mode === 'year' ? normalized : [],
      };
    }

    // 3) Fallback: nothing usable
    return {
      daily: [],
      monthly: [],
      yearly: [],
    };
  }, []);

  const normalizeEntries = (
    entries: any,
    mode: 'daily' | 'monthly' | 'yearly'
  ): AggregateEntry[] => {
    // --- FIXED: normalizePeriod now has proper access to `mode` ---
    const normalizePeriod = (raw: unknown): string => {
      const trimmed = String(raw ?? '').trim();
      if (!trimmed) return '';

      const dayMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      const monthMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})/);
      const yearMatch = trimmed.match(/^(\d{4})/);

      if (mode === 'daily') {
        if (dayMatch) {
          const [, y, m, d] = dayMatch;
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
        return trimmed;
      }

      if (mode === 'monthly') {
        if (dayMatch || monthMatch) {
          const [, y, m] = (dayMatch ?? monthMatch)!;
          return `${y}-${m.padStart(2, '0')}`;
        }
        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
          const y = parsed.getUTCFullYear();
          const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
          return `${y}-${m}`;
        }
        return trimmed;
      }

      if (yearMatch) return yearMatch[1];

      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) return String(parsed.getUTCFullYear());

      return trimmed;
    };

    // --- FIXED: proper entry list creation ---
    const list = Array.isArray(entries)
      ? entries
      : entries && typeof entries === 'object'
      ? Object.entries(entries).map(([period, value]) => ({
          period,
          ...(value as Record<string, unknown>),
        }))
      : entries
      ? [entries]
      : [];

    return list.map((entry: any) => {
      const id = entry?._id ?? {};
      const src = typeof id === 'object' && id !== null ? id : entry;

      const yVal = src.year ?? src.y ?? src._year;
      const mVal = src.month ?? src.m ?? src._month;
      const dVal = src.day ?? src.d ?? src._day;

      const year = yVal != null ? String(yVal) : null;
      const month = mVal != null ? String(mVal).padStart(2, '0') : null;
      const day = dVal != null ? String(dVal).padStart(2, '0') : null;

      let period: string;

      if (mode === 'daily' && year && month && day) {
        period = `${year}-${month}-${day}`;
      } else if (mode === 'monthly' && year && month) {
        period = `${year}-${month}`;
      } else if (mode === 'yearly' && year) {
        period = year;
      } else {
        const raw =
          entry?.period ??
          entry?.date ??
          entry?.day ??
          entry?.label ??
          id?.period ??
          id?.date ??
          id?.day ??
          '';
        period = normalizePeriod(raw);
      }

      const bookingsNum = Number(
        entry?.bookings ??
          entry?.totalBooks ??
          entry?.books ??
          entry?.count ??
          entry?.totalCount
      );
      const revenueNum = Number(
        entry?.revenue ??
          entry?.totalRevenue ??
          entry?.amount ??
          entry?.totalAmount ??
          entry?.grossRevenue
      );

      const commissionValue = Number(
        entry?.commission ?? entry?.partnerCommission ?? entry?.commissionSum,
      );

      const qrScansNum = Number(entry?.qrScans ?? entry?.totalQrScans ?? entry?.scans);

      return {
        period,
        bookings: Number.isFinite(bookingsNum) ? bookingsNum : 0,
        revenue: Number.isFinite(revenueNum) ? revenueNum : 0,
        commission: Number.isFinite(commissionValue)
          ? Math.max(0, commissionValue)
          : undefined,
        qrScans: Number.isFinite(qrScansNum) ? Math.max(0, qrScansNum) : undefined,
      };
    });
  };

  const personalInfoFAQ = [
    {
      question: 'Why should my username be unique?',
      answer:
        'Your username helps identify you on the platform. A unique name prevents confusion and ensures others can easily recognize and connect with you.',
    },
    {
      question: 'Why is my email address required?',
      answer:
        'Your email is used for account verification, important updates, and booking confirmations. Make sure it’s always valid and accessible.',
    },
    {
      question: 'Do I need to provide a phone number?',
      answer:
        'Phone number is optional. However, adding it can help in urgent communication between you and your host or guest, especially during travel.',
    },
    {
      question: 'Why should I provide a preferred contact method?',
      answer:
        'Choosing a preferred contact method helps us know how to best reach you, and ensures smoother communication between you, travelers, and hosts. Format e.g, Whatsapp: +1212 555 4567 / Telegram: @username',
    },
    {
      question: 'How can I update my legal name?',
      answer:
        'Click "Edit" next to Legal Name, make the necessary changes, and hit Save. Your legal name helps with billing and identity verification.',
    },
    {
      question: 'Why is my address important?',
      answer:
        'Your address is used for billing and helps speed up the checkout process. It also ensures that invoices and payout info are correctly generated.',
    },
  ];  

  const loginSecurityFAQ = [
    {
      question: 'How can I change my password?',
      answer:
        'Click "Update" next to Password. For security reasons, you’ll need to enter your current password, then your new password and confirm it. Note: Passwords are securely stored as encrypted hashes — meaning even we can’t see them.',
    },
    {
      question: 'What if I forgot my password?',
      answer:
        'No worries! Just click "Forgot password" on the login screen. We’ll send you a secure email link to reset your password.',
    },
    {
      question: 'Can I deactivate my account?',
      answer:
        'Yes, you can. Click "Deactivate" in the Account section. Please note: This action is permanent. Once confirmed, your account will be deactivated and removed from the platform — it cannot be undone.',
    },
  ];  

  const paymentsFAQ = [
    {
      question: 'How do I save my payment card?',
      answer:
        'Click "Add Card" to enter your billing details. Your card number is encrypted before being stored in our database, ensuring maximum security. If you prefer not to save it, you can enter it at checkout — it won’t be stored on our platform.',
    },
    {
      question: 'Do you collect CVV and expiration date?',
      answer:
        'No, for security reasons, we only collect and store your card number. CVV and expiration date are not collected or stored. This ensures your sensitive payment details stay safe while still allowing for faster checkout.',
    },
    {
      question: 'What withdrawal methods are supported?',
      answer:
        'We support Credit/Debit Cards, Revolut, IBAN, and PayPal for payouts. We only store the essential parts securely: card number for cards, IBAN credential for IBAN, and either username or phone number for PayPal.',
    },
    {
      question: 'When are payouts processed?',
      answer:
        'Payouts are processed twice a month. To ensure timely payments, make sure your withdrawal method is correctly added and up to date.',
    },
    {
      question: 'Can I delete my saved payment or withdrawal method?',
      answer:
        'Absolutely. You can delete your stored card or withdrawal method at any time and update it with new credentials as needed.',
    },
    {
      question: 'Are these settings relevant for travelers?',
      answer: 'Only the payment method section is relevant for travelers — it lets you store your card for faster checkout. The withdrawal section is only for hosts and promoters who receive payouts.',
    }    
  ];  

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await axios.get('/api/analytics/earnings');
        const daily = res.data.daily;

        const safeParseDateOnly = (value: string) => {
          if (!value) return null;
          const parsed = new Date(`${value}T00:00:00Z`);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        };
  
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const computedLast24Hours = Array.isArray(daily)
          ? daily.reduce((sum: number, entry: { date: string; amount?: number }) => {
              const parsedDate = safeParseDateOnly(entry.date);
              if (!parsedDate) return sum;
              return parsedDate >= twentyFourHoursAgo && parsedDate <= now
                ? sum + Number(entry.amount ?? 0)
                : sum;
            }, 0)
          : 0;

        const todaysProfitFromApi = Number(res.data.todaysProfit);
        const todaysProfit = Number.isFinite(todaysProfitFromApi)
          ? todaysProfitFromApi
          : computedLast24Hours;

        const revenueTotals = res.data.revenueTotals ?? {
          daily: Array.isArray(daily) ? daily.reduce((sum: number, entry: any) => sum + Number(entry?.amount ?? 0), 0) : 0,
          monthly: Array.isArray(res.data.monthly)
            ? res.data.monthly.reduce((sum: number, entry: any) => sum + Number(entry?.amount ?? 0), 0)
            : 0,
          yearly: Array.isArray(res.data.yearly)
            ? res.data.yearly.reduce((sum: number, entry: any) => sum + Number(entry?.amount ?? 0), 0)
            : 0,
          all: Number(res.data.totalEarnings ?? 0),
        };

  
        setEarnings({
          daily,
          monthly: res.data.monthly,
          yearly: res.data.yearly,
          dailyProfit: todaysProfit,
          todaysProfit,
          totalEarnings: res.data.totalEarnings,
          currency: res.data.currency ?? BASE_CURRENCY,
          revenueTotals,
        });
      } catch (err) {
        console.error("Earnings fetch failed:", err);
      }
    };

   const fetchPayouts = async () => {
      try {
        const res = await axios.get('/api/analytics/payouts');
        if (Array.isArray(res.data)) {
          setPayoutRecords(res.data);
        }
      } catch (error) {
        console.error('Payout history fetch failed:', error);
      }
    };

    if (['host', 'promoter'].includes(currentUser.role)) {
      fetchEarnings();
      fetchPayouts();
    }
  }, [currentUser.role]); 

  useEffect(() => {
    if (currentUser.role !== 'host') return;

    const todayKey = new Date().toISOString().split('T')[0];

    const todaysProfit =
      commissionAdjustedEntries.daily.find((entry) => entry.date === todayKey)?.amount ?? 0;

    // This is the host-share sum, but we’ll treat it as “pre-withdrawal earnings”,
    // NOT the canonical lifetime total.
    const hostShareTotal = commissionAdjustedEntries.daily.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );

    const breakdownTotals = {
      daily: commissionAdjustedEntries.daily.reduce((sum, entry) => sum + entry.amount, 0),
      monthly: commissionAdjustedEntries.monthly.reduce((sum, entry) => sum + entry.amount, 0),
      yearly: commissionAdjustedEntries.yearly.reduce((sum, entry) => sum + entry.amount, 0),
    };

    setEarnings((prev) => {
      const baseTotal = prev?.totalEarnings ?? hostShareTotal; // keep 195.50 if we already have it

      const revenueTotals: Record<'daily' | 'monthly' | 'yearly' | 'all', number> = {
        daily: breakdownTotals.daily,
        monthly: breakdownTotals.monthly,
        yearly: breakdownTotals.yearly,
        // IMPORTANT: “all” stays tied to the backend total (195.50), not the host-share sum
        all: prev?.revenueTotals?.all ?? baseTotal,
      };

      return {
        daily: commissionAdjustedEntries.daily,
        monthly: commissionAdjustedEntries.monthly,
        yearly: commissionAdjustedEntries.yearly,
        dailyProfit: todaysProfit,
        todaysProfit,
        totalEarnings: baseTotal,                           // ← keep backend 195.50
        currency: prev?.currency ?? hostCurrency ?? BASE_CURRENCY,
        revenueTotals,
      };
    });
  }, [
    commissionAdjustedEntries.daily,
    commissionAdjustedEntries.monthly,
    commissionAdjustedEntries.yearly,
    currentUser.role,
    hostCurrency,
  ]);

  useEffect(() => {
    const fetchSavedCard = async () => {
      try {
        const res = await axios.get('/api/users/get-card');
        if (res.data) {
          setSavedCard(res.data);
          // console.log("Saved card", res.data);
        }
      } catch (err) {
        console.error('Failed to fetch saved card', err);
      }
    };
  
    fetchSavedCard();
  }, [cardUpdated]);  

  // useEffect(() => {
  //   const fetchAnalytics = async () => {
  //     const res = await axios.get('/api/analytics/get');
  //     setAnalytics(res.data);
  //   };
  //   fetchAnalytics();
  // }, []); 

    useEffect(() => {
    if (currentUser?.role !== 'promoter') return;

    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics/promoter/get', {
          timeout: 10000,
          params: {
            granularity: promoterActivityFilter,
          },
        });
        const data = res.data ?? {};
        const breakdown = normalizeBreakdown(data.breakdown, promoterActivityFilter);

        setAnalytics({
          totalBooks: Number(data.totalBooks ?? 0),
          qrScans: Number(data.qrScans ?? 0),
          totalRevenue: Number(data.totalRevenue ?? 0),
          partnerCommission: MIN_PARTNER_COMMISSION,
          punti: 0,
          puntiShare: 0,
          puntiLabel: getPuntiLabel(0),
          breakdown,
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchAnalytics();

    const interval = setInterval(fetchAnalytics, 20000);
    return () => clearInterval(interval);
  }, [currentUser?.role, normalizeBreakdown, promoterActivityFilter]);

  useEffect(() => {
    const fetchUserCoupon = async () => {
      try {
        const res = await axios.get('/api/coupon/getusercoupon');
        const { code, used } = res.data;
  
        if (used) {
          setUserCoupon(null); // Do not show used coupons
        } else {
          setUserCoupon(code || null);
        }
      } catch (err) {
        console.error('Failed to fetch coupon:', err);
        setUserCoupon(null);
      }
    };
  
    if (currentUser?.role === 'customer') {
      fetchUserCoupon();
    }
  }, [currentUser]);  

  const handleCommissionUpdate = useCallback(
    async (commission: number) => {
      if (currentUser?.role !== "host") return;

      try {
        setUpdatingCommission(true);

        const safeCommission = Math.min(
          MAX_PARTNER_COMMISSION,
          Math.max(MIN_PARTNER_COMMISSION, commission)
        );

        const res = await axios.post(
          "/api/analytics/host/update-commission",
          { commission: safeCommission },
          { timeout: 10000 }
        );

        const data = res.data ?? {};
        const totalBooksValue = Number(data.totalBooks ?? 0);
        const totalRevenueValue = Number(data.totalRevenue ?? 0);
        const partnerCommissionValue = Number(data.partnerCommission);
        const puntiValue = Number(data.punti);
        const puntiShareValue = Number(data.puntiShare);
        const puntiLabelValue =
          typeof data.puntiLabel === "string" ? data.puntiLabel : undefined;
          const platformRelevanceValue = Number(data.platformRelevance);

        setHostAnalytics((prev) => {
          const fallback = {
            totalBooks: 0,
            totalRevenue: 0,
            partnerCommission: MIN_PARTNER_COMMISSION,
            punti: 0,
            puntiShare: 0,
            puntiLabel: getPuntiLabel(0),
            platformRelevance: 0,
          };

          const base = prev ?? fallback;

          const nextPartnerCommission = Number.isFinite(partnerCommissionValue)
            ? Math.min(
                MAX_PARTNER_COMMISSION,
                Math.max(MIN_PARTNER_COMMISSION, partnerCommissionValue)
              )
            : base.partnerCommission;

          const nextPunti = Number.isFinite(puntiValue)
            ? Math.max(0, puntiValue)
            : base.punti;

          const nextPuntiShare = Number.isFinite(puntiShareValue)
            ? Math.min(1, Math.max(0, puntiShareValue))
            : base.puntiShare;

          const nextPuntiLabel = puntiLabelValue ?? getPuntiLabel(nextPunti);
          const nextPlatformRelevance = Number.isFinite(platformRelevanceValue)
            ? Math.max(0, platformRelevanceValue)
            : base.platformRelevance;

          return {
            totalBooks: Number.isFinite(totalBooksValue)
              ? totalBooksValue
              : base.totalBooks,
            totalRevenue: Number.isFinite(totalRevenueValue)
              ? totalRevenueValue
              : base.totalRevenue,
            partnerCommission: nextPartnerCommission,
            punti: nextPunti,
            puntiShare: nextPuntiShare,
            puntiLabel: nextPuntiLabel,
            platformRelevance: nextPlatformRelevance,
          };
        });

        toast.success("Partnership commission updated");
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error("Error updating partnership commission", {
            status: error.response?.status,
            data: error.response?.data,
          });

          const message =
            (error.response?.data as any)?.message ||
            `Unable to update partnership commission (status ${
              error.response?.status ?? "unknown"
            })`;

          toast.error(message);
        } else {
          console.error("Unexpected error updating partnership commission:", error);
          toast.error("Unexpected error updating partnership commission");
        }
      } finally {
        setUpdatingCommission(false);
      }
    },
    [currentUser?.role]
  );


  useEffect(() => {
    if (currentUser?.role !== 'host') return;
  
    const fetchHostAnalytics = async () => {
      try {
        const res = await axios.get('/api/analytics/host/get', {
          timeout: 10000,
          params: { granularity: hostActivityFilter },
        });
        // setHostAnalytics(res.data);
        const data = res.data ?? {};
        const puntiValue = Number(data.punti);
        const punti = Number.isFinite(puntiValue) ? puntiValue : 0;
        const puntiShareValue = Number(data.puntiShare);
        const puntiShare = Number.isFinite(puntiShareValue)
          ? Math.min(1, Math.max(0, puntiShareValue))
          : 0;
        const platformRelevanceValue = Number(data.platformRelevance);

        const breakdown = normalizeBreakdown(
          data.breakdown,
          hostActivityFilter === 'day'
            ? 'day'
            : hostActivityFilter === 'month'
            ? 'month'
            : 'year',
        );

        const partnerCommissionValue = Number(data.partnerCommission);

        setHostAnalytics({
          totalBooks: Number(data.totalBooks ?? 0),
          totalRevenue: Number(data.totalRevenue ?? 0),
          partnerCommission: Number.isFinite(partnerCommissionValue)
            ? partnerCommissionValue
            : MIN_PARTNER_COMMISSION,
          punti,
          puntiShare,
          puntiLabel: typeof data.puntiLabel === 'string' ? data.puntiLabel : getPuntiLabel(punti),
          platformRelevance: Number.isFinite(platformRelevanceValue)
            ? Math.max(0, platformRelevanceValue)
            : 0,
          breakdown,
          currency: typeof data.currency === 'string' ? data.currency : BASE_CURRENCY,
        });

        setHostBreakdown(breakdown);

      } catch (error) {
        console.error('Error fetching host analytics:', error);
      }
    };
  
    fetchHostAnalytics();
    const interval = setInterval(fetchHostAnalytics, 20000);
  
    return () => clearInterval(interval);
  }, [currentUser?.role, hostActivityFilter, normalizeBreakdown]);

  useEffect(() => {
    try {
      const parsedAddress = currentUser.address ? JSON.parse(currentUser.address) : {};
      const normalizedCountry =
        parsedAddress && typeof parsedAddress === 'object' && 'country' in parsedAddress
          ? (parsedAddress.country as CountrySelectValue | null)
          : null;

      setFieldValues({
        username: currentUser.username || '',
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        contact: currentUser.contact || '',
        legalName: currentUser.legalName || '',
        country: normalizedCountry,
        street: parsedAddress.street || '',
        apt: parsedAddress.apt || '',
        city: parsedAddress.city || '',
        state: parsedAddress.state || '',
        zip: parsedAddress.zip || ''
      });
    } catch {
      // fallback in case of malformed address
    }
  }, [currentUser]);  

  useEffect(() => {
    const fetchPayoutMethod = async () => {
      try {
        const res = await axios.get('/api/users/get-payout-method');
        if (res.data) {
          setSavedPayout(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch withdrawal method', err);
      }
    };
  
    if (['promoter', 'host'].includes(currentUser?.role)) {
      fetchPayoutMethod();
    }
    // fetchPayoutMethod();
  }, [payoutUpdated, currentUser?.role]);

  useEffect(() => {
    if (['promoter', 'host'].includes(currentUser.role)) {
      setActivePaymentTab('payout');
    } else if (currentUser.role === 'customer') {
      setActivePaymentTab('payment');
    }
  }, [currentUser?.role]);  

  const handleSavePayoutMethod = async () => {
    try {
      const { method, number } = payoutInfo;
  
      if (!number) {
        // setPopupMessage('Please enter your withdraw details.');
        toast.error('Please enter your withdraw details.')
        return;
      }
  
      if (method === 'iban' && (!number.startsWith('IT') || number.replace(/\s/g, '').length !== 27)) {
        // setPopupMessage('IBAN must start with IT and be 27 characters.');
        toast.error('IBAN must start with IT and be 27 characters.')
        return;
      }
  
      await axios.post('/api/users/save-payout-method', {
        method,
        number, // ✅ Must match backend’s expected structure
      });
  
      // setPopupMessage('Withdraw method saved!');
      toast.success('Withdrawal method saved!', {
        iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
        }
      });
      
      setPayoutUpdated((prev) => !prev);
    } catch (err) {
      console.error('Failed to save withdrawal method', err);
      // setPopupMessage('Error saving withdraw method.');
      toast.error('Error saving withdrawal method.')
    }
  };  
  
  const handleDeletePayoutMethod = async () => {
    try {
      await axios.delete('/api/users/delete-payout-method');
      setSavedPayout(null);
      // setPopupMessage('Withdraw method deleted!');
      toast.success('Withdrawal method deleted!', {
        iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
        }
      });
    } catch (err) {
      console.error('Failed to delete withdrawal method', err);
      // setPopupMessage('Error deleting withdraw method.');
      toast.error('Error deleting withdrawal method.');
    }
  };  

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardInfo((prev) => ({ ...prev, [name]: value }));
  };

  const detectCardType = (number: string) => {
    const sanitized = number.replace(/\s+/g, '');
    const patterns: { [key: string]: RegExp } = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      americanexpress: /^3[47]/,
    };
  
    for (const type in patterns) {
      if (patterns[type].test(sanitized)) {
        return type;
      }
    }
    return 'card'; // default fallback
  };  

  const initials = currentUser.name?.[0]?.toUpperCase() || 'V';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSubmit = async () => {
    if (!uploadedImage || !croppedAreaPixels) return;
    const croppedBase64 = await getCroppedImg(uploadedImage, croppedAreaPixels);
    setProfileImage(croppedBase64);
    setIsCropping(false);

    try {
      await axios.put('/api/users/profile-image', { image: croppedBase64 });
    } catch (err) {
      console.error("Image upload failed", err);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setUploadedImage(null);
  };

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveField = async (key: string) => {
    try {
      let payload;
  
      if (key === 'address') {
        const { country, street, apt, city, state, zip } = fieldValues;

        payload = {
          address: JSON.stringify({
            country,
            street,
            apt,
            city,
            state,
            zip
          }),
        };
      } else if (key === 'username') {
        const sanitized = slugSegment(fieldValues.username || '').toLowerCase();
        payload = { username: sanitized };
      } else {
        payload = {
          [key]: fieldValues[key as keyof typeof fieldValues]
        };
      }
  
      const res = await axios.put('/api/users/profile-info', payload);
  
      setFieldValues((prev) => ({
        ...prev,
        ...res.data,
        ...(res.data.address
          ? JSON.parse(res.data.address)
          : {})
      }));
  
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update field', err);
    }
  };  

  useEffect(() => {
    if (activeSection !== null) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection]);  

  // useEffect(() => {
  //   const checkAndSubscribe = async () => {
  //     try {
  //       const res = await fetch(`/api/email/check-subscription?email=${currentUser.email}`);
  //       const data = await res.json();
  
  //       if (data?.subscribed) {
  //         setIsSubscribed(true);
  //       } else {
  //         // Auto-subscribe user if not yet subscribed
  //         const subRes = await fetch('/api/email/profile-newsletter', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({ email: currentUser.email, type: 'experience' }),
  //         });
  
  //         if (subRes.ok) {
  //           setIsSubscribed(true);
  //           console.log('✅ Auto-subscribed to Newsletter');
  //         } else {
  //           console.warn('⚠️ Auto-subscription failed');
  //         }
  //       }
  //     } catch (err) {
  //       console.error('❌ Failed to check or subscribe to newsletter', err);
  //     }
  //   };
  
  //   if (currentUser?.role === 'customer') {
  //     checkAndSubscribe();
  //   }
  // }, [currentUser]);  

  // const handleToggleSubscription = async () => {
  //   setLoading(true);
  //   try {
  //     const endpoint = isSubscribed
  //       ? '/api/email/profile-newsletter'
  //       : '/api/email/profile-newsletter';
  
  //     const method = isSubscribed ? 'DELETE' : 'POST';
  
  //     const res = await fetch(endpoint, {
  //       method,
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ email: currentUser.email, type: 'experience' }),
  //     });
  
  //     if (!res.ok) throw new Error('Failed to toggle subscription');
  
  //     setIsSubscribed(!isSubscribed);
  //   } catch (error) {
  //     console.error('Toggle subscription error:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch(`/api/email/check-subscription?email=${currentUser.email}&type=experience`);
        const data = await res.json();
        setIsSubscribed(data.subscribed);
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
      } finally {
        setLoadingSubscription(false);
      }
    };

    if (currentUser?.email) checkSubscription();
  }, [currentUser?.email]);


  const handleToggleSubscription = async () => {
    setLoading(true);
    try {
      const method = isSubscribed ? 'DELETE' : 'POST';
      const res = await fetch('/api/email/profile-newsletter', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, type: 'experience' }),
      });

      if (res.status === 409) {
        console.info('Already subscribed');
        toast('Already subscribed 💌');
        setIsSubscribed(true); // <-- ensure UI reflects DB truth
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to toggle subscription');
      }

      setIsSubscribed(!isSubscribed);
      toast.success(
        isSubscribed ? 'Unsubscribed from newsletter.' : 'Subscribed to newsletter.', 
        {
          iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
          },
        }
      );
    } catch (error) {
      console.error('Toggle subscription error:', error);
      toast.error('Something went wrong while toggling subscription.');
    } finally {
      setLoading(false);
    }
  };

    return (
    <Container className="py-10">
      <motion.div
        className="pageadjust px-5 space-y-8"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >

      <div className="rounded-3xl overflow-visible shadow-xl border border-neutral-100 bg-white">
        <div className="relative z-0 h-56 sm:h-64 md:h-72 overflow-visible">
          {/* ROLE SWITCH — bottom-center over the cover */}
          {currentUser?.role !== 'promoter' && (
          <div className="absolute left-1/2 -bottom-6 translate-x-[-50%] z-[99999]">
            <Switch.Group as="div" className="flex flex-col items-center">
              <Switch
                checked={isHostView} 
                onChange={(checked) => handleRoleToggle(checked)}
                disabled={!canToggleRole || roleUpdating}
                aria-busy={roleUpdating}
                aria-label="Toggle role"
                className={twMerge(
                  'relative inline-flex h-12 w-[230px] items-center rounded-2xl px-1',
                  'transition-all duration-500 focus:outline-none overflow-visible',
                  'bg-white',
                  'focus-visible:ring-4 focus-visible:ring-black/10 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                  (!canToggleRole || roleUpdating) && 'cursor-not-allowed opacity-60'
                )}
              >
                {/* BORDER PULSE — remounts on each state to retrigger animation */}
                {/* <motion.div
                  key={isHostView ? 'pulse-host' : 'pulse-guest'}
                  className={twMerge(
                    'pointer-events-none absolute inset-0 -m-[2px] rounded-full z-10',
                    isHostView ? 'ring-2 ring-[#000]' : 'ring-2 ring-neutral-400'
                  )}
                  initial={{ opacity: 0.55, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.18 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                /> */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-1 rounded-full bg-white"
                />

                {/* SLIDING PILL */}
                <div className="relative z-10 grid w-full grid-cols-2 px-4 text-[8px] font-semibold uppercase tracking-[0.18em]">
                  <span
                    className={twMerge(
                      'text-center transition-colors duration-300',
                      isHostView ? 'text-neutral-500' : 'text-neutral-900'
                    )}
                  >
                    Guest
                  </span>
                  <span
                    className={twMerge(
                      'text-center transition-colors duration-300',
                      isHostView ? 'text-neutral-900' : 'text-neutral-500'
                    )}
                  >
                    Host
                  </span>
                </div>

                <motion.span
                  layout
                  initial={false}
                  transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                  className={twMerge(
                    // 'pointer-events-none absolute left-[3px] top-[3px] z-20',
                    // 'flex h-[26px] w-[34px] items-center justify-center rounded-full',
                    // 'px-[5px] text-[8px] font-semibold uppercase tracking-wide leading-none whitespace-nowrap',
                    // isHostView ? 'bg-white text-neutral-900' : 'bg-[#000] text-white'
                    'absolute top-1 bottom-1 left-1 z-20 flex w-[108px] items-center justify-center rounded-xl',
                    'bg-gradient-to-b from-white to-[#e3e6ed]',
                    'border border-white/50 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-800'
                  )}
                  animate={{ x: isHostView ? 113 : 0 }}
                >
                  {isHostView ? 'Host mode' : 'Guest mode'}
                </motion.span>
              </Switch>
            </Switch.Group>

              </div>
            )}

                {coverImage ? (
                  <NextImage
                    src={coverImage}
                    alt={`Cover for ${currentUser?.name ?? currentUser?.username ?? 'user'}`}
                    fill
                    placeholder="blur"
                    blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
                    className={twMerge(
                      'rounded-3xl object-cover pointer-events-none z-0 transition-[filter,opacity,transform] duration-500 ease-out',
                      coverLoaded ? 'blur-0 opacity-100 scale-100' : 'blur-md opacity-80 scale-[1.02]'
                    )}
                    onLoadingComplete={() => setCoverLoaded(true)}
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-neutral-200" />
                )}

                <div className="rounded-3xl absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

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
                            className="aspect-square absolute top-3 right-3 z-[2] inline-flex items-center gap-2 rounded-full backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg transition"
                            title="Change cover"
                          >
                            <TbWorldUpload className="h-5 w-5" />
                            {uploading ? '…' : uploadingCover ? '…' : ''}
                          </button>
                        )}
                      />
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverSelect}
                    />
                  </>
                )}

                <div className="absolute inset-x-0 bottom-0 z-[2] px-6 pb-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {isOwner ? (
                          <>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={busy}
                              className="group rounded-full outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-black/20"
                              title="Change avatar"
                            >
                              <div className="rounded-full overflow-hidden ring-0 transition shadow-md hover:shadow-lg cursor-pointer">
                                <Avatar
                                  src={profileImage || currentUser?.image || undefined}
                                  name={currentUser?.name ?? currentUser?.username ?? 'User'}
                                  size={92}
                                />
                              </div>
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}   // 👈 uses crop flow
                            />
                          </>
                        ) : (
                          <Avatar
                            src={currentUser?.image ?? undefined}
                            name={currentUser?.name ?? currentUser?.username ?? 'User'}
                            size={92}
                          />
                        )}
                      </div>

                      <div className="text-white drop-shadow-lg">
                        {/* {currentUser?.identityVerified ? (
                          <span className="w-fit items-center gap-1 rounded-full shadow-md backdrop-blur-sm text-emerald-400 px-2.5 py-1.5 pb-0.5 text-[10px] font-bold">
                            ✓ ID VERIFIED
                          </span>
                        ) : (
                          <span className="w-fit items-center gap-1 shadow-md rounded-full backdrop-blur-sm text-orange-400 px-2.5 py-1.5 text-[10px] font-bold">
                            ID IN REVIEW
                          </span>
                        )} */}

                        <p className="ml-1 text-2xl font-semibold flex items-center gap-2">
                          {currentUser?.username || currentUser?.name || 'User'}
                        </p>

                        {currentUser?.legalName && (
                          <p className="ml-1 text-sm text-white/80">{currentUser.legalName}</p>
                        )}
                      </div>
                    </div>

                    {/* Optional right-side chips (profession, languages) — keep or remove */}
                    <div className="flex flex-wrap items-center gap-3 text-white/90">
                      {currentUser?.profession && (
                        <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                          {currentUser.profession}
                        </span>
                      )}
                      {/* You can insert your languages popup here if you have `spokenLanguages` */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

  
      <AnimatePresence initial={false} mode="wait">
        {activeSection === 'personal-info' && (
          <motion.section
            key="personal-info"
            variants={sectionVariants}
            initial={hasMounted ? 'hidden' : false}
            animate="visible"
            exit="exit"
            className="mt-8 flex w-full flex-col gap-10 pt-0 md:pt-5 lg:flex-row"
          >
            <motion.div
              variants={cardVariants}
              className="w-full rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg lg:w-1/2"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="rounded-full px-2 py-1 text-xs text-black transition hover:bg-neutral-100 md:text-sm"
                  >
                    ←
                  </button>
                  <h2 className="text-base font-bold md:text-lg">Personal Area</h2>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'Username', key: 'username' },
                  { label: 'Legal name', key: 'legalName' },
                  { label: 'Email address', key: 'email' },
                  { label: 'Phone number', key: 'phone' },
                  { label: 'Preferred contact method', key: 'contact' },
                  { label: 'Address', key: 'address' },
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wide text-neutral-500 md:text-sm">{label}</p>

                      <AnimatePresence initial={false} mode="wait">
                        {editingField === key ? (
                          key === 'address' ? (
                            <>
                              <motion.div
                                key="address-edit"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-4 pt-4"
                              >
                                <CountrySelect
                                  value={fieldValues.country ?? undefined}
                                  onChange={(val) =>
                                    setFieldValues((prev) => ({
                                      ...prev,
                                      country: val,
                                    }))
                                  }
                                />

                                <div className="relative w-full px-1">
                                  <input
                                    type="text"
                                    id="street"
                                    placeholder=" "
                                    value={fieldValues.street}
                                    onChange={(e) =>
                                      setFieldValues((prev) => ({ ...prev, street: e.target.value }))
                                    }
                                    className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                  />
                                  <label
                                    htmlFor="street"
                                    className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                      fieldValues.street ? 'top-2 text-sm text-black' : ''
                                    }`}
                                  >
                                    Street address
                                  </label>
                                </div>

                                <div className="relative w-full px-1">
                                  <input
                                    type="text"
                                    id="apt"
                                    placeholder=" "
                                    value={fieldValues.apt}
                                    onChange={(e) =>
                                      setFieldValues((prev) => ({ ...prev, apt: e.target.value }))
                                    }
                                    className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                  />
                                  <label
                                    htmlFor="apt"
                                    className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                      fieldValues.apt ? 'top-2 text-sm text-black' : ''
                                    }`}
                                  >
                                    Apt, suite, etc. (optional)
                                  </label>
                                </div>

                                <div className="relative w-full px-1">
                                  <input
                                    type="text"
                                    id="city"
                                    placeholder=" "
                                    value={fieldValues.city}
                                    onChange={(e) =>
                                      setFieldValues((prev) => ({ ...prev, city: e.target.value }))
                                    }
                                    className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                  />
                                  <label
                                    htmlFor="city"
                                    className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                      fieldValues.city ? 'top-2 text-sm text-black' : ''
                                    }`}
                                  >
                                    City
                                  </label>
                                </div>

                                <div className="relative w-full px-1">
                                  <input
                                    type="text"
                                    id="state"
                                    placeholder=" "
                                    value={fieldValues.state}
                                    onChange={(e) =>
                                      setFieldValues((prev) => ({ ...prev, state: e.target.value }))
                                    }
                                    className="peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                  />
                                  <label
                                    htmlFor="state"
                                    className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                      fieldValues.state ? 'top-2 text-sm text-black' : ''
                                    }`}
                                  >
                                    State / Province
                                  </label>
                                </div>

                                <div className="relative w-full px-1">
                                  <input
                                    type="text"
                                    id="zip"
                                    placeholder=" "
                                    value={fieldValues.zip}
                                    onChange={(e) =>
                                      setFieldValues((prev) => ({ ...prev, zip: e.target.value }))
                                    }
                                    className="mb-4 peer w-full rounded-xl border border-neutral-300 px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                                  />
                                  <label
                                    htmlFor="zip"
                                    className={`absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black ${
                                      fieldValues.zip ? 'top-2 text-sm text-black' : ''
                                    }`}
                                  >
                                    ZIP Code
                                  </label>
                                </div>
                              </motion.div>

                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleSaveField(key)}
                                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                              >
                                Save
                              </motion.button>
                            </>
                          ) : (
                            <motion.div
                              key={`${key}-edit`}
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.25 }}
                              className="space-y-4 pt-4"
                            >
                              <input
                                type="text"
                                value={fieldValues[key as keyof typeof fieldValues] as string}
                                onChange={(e) =>
                                  setFieldValues((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                className="w-full border-b border-neutral-300 px-2 py-2 text-sm focus:border-black focus:outline-none md:text-base"
                              />
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleSaveField(key)}
                                className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                              >
                                Save
                              </motion.button>
                              
                            </motion.div>
                          )
                        ) : key === 'address' ? (
                          <div className="text-md text-neutral-800 space-y-1">
                            {fieldValues.country && (
                              <div className="flex items-center gap-2">
                                <Image
                                  src={`/flags/${fieldValues.country.value?.split('-').pop()?.toLowerCase()}.svg`}
                                  alt={fieldValues.country.label}
                                  width={24}
                                  height={16}
                                  className="ml-0.5 h-4 w-6 rounded object-cover"
                                />
                                <span>
                                  {fieldValues.country.city ? `${fieldValues.country.city}, ` : ''}
                                  {fieldValues.country.label}
                                </span>
                              </div>
                            )}

                            {fieldValues.street && <div>{fieldValues.street}</div>}
                            {fieldValues.apt && <div>{fieldValues.apt}</div>}
                            {fieldValues.state && <div>{fieldValues.state}</div>}
                            {fieldValues.zip && <div>{fieldValues.zip}</div>}

                            {!fieldValues.country &&
                              !fieldValues.street &&
                              !fieldValues.apt &&
                              !fieldValues.state &&
                              !fieldValues.zip && (
                                <p className="text-md text-neutral-800">Not provided</p>
                              )}
                          </div>
                        ) : key === 'email' ? (
                          <div className="space-y-2 pt-1">
                            <p className="text-sm text-neutral-800 md:text-base">
                              {fieldValues.email?.trim() || 'Not provided'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <VerificationBadge
                                verified={emailVerified}
                                pendingLabel="Pending verification"
                                size="sm"
                              />
                              {!emailVerified && fieldValues.email?.trim() && (
                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.97 }}
                                  onClick={handleEmailVerificationRequest}
                                  disabled={verifying || emailVerificationRequested}
                                  className={`rounded-full border border-neutral-900/20 px-3 py-1 text-[12px] font-medium text-neutral-800 transition hover:bg-neutral-900/5 ${
                                    verifying ? 'pointer-events-none opacity-60' : ''
                                  }`}
                                >
                                  {verifying
                                    ? 'Sending…'
                                    : emailVerificationRequested
                                    ? 'Check your inbox'
                                    : 'Verify email'}
                                </motion.button>
                              )}
                            </div>
                          </div>
                        ) : key === 'phone' ? (
                          <div className="space-y-3 pt-1">
                            <p className="text-sm text-neutral-800 md:text-base">
                              {fieldValues.phone?.trim() || 'Not provided'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <VerificationBadge
                                verified={phoneVerified}
                                pendingLabel="Pending verification"
                                size="sm"
                              />
                              {!phoneVerified && fieldValues.phone?.trim() && (

                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.97 }}
                                  onClick={handlePhoneVerificationRequest}
                                  disabled={phoneVerificationLoading}
                                  className={`rounded-full border border-neutral-900/20 px-3 py-1 text-[12px] font-medium text-neutral-800 transition hover:bg-neutral-900/5 ${
                                    phoneVerificationLoading ? 'pointer-events-none opacity-60' : ''
                                  }`}
                                >
                                  {phoneVerificationLoading
                                    ? 'Sending…'
                                    : phoneVerificationRequested
                                    ? 'Request code'
                                    : 'Verify phone'}
                                </motion.button>
                              )}
                            </div>
                            <AnimatePresence>
                              {phoneVerificationRequested && !phoneVerified && fieldValues.phone?.trim() && (
                                <motion.form
                                  key="phone-verification"
                                  onSubmit={handlePhoneCodeSubmit}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -8 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-full rounded-2xl border border-neutral-200 bg-white/70 p-4 text-sm shadow-sm backdrop-blur"
                                >
                                  <label
                                    htmlFor="profile-phone-code"
                                    className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
                                  >
                                    Enter verification code
                                  </label>
                                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                    <input
                                      id="profile-phone-code"
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      maxLength={6}
                                      value={phoneVerificationCode}
                                      onChange={(event) => {
                                        const value = event.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                                        setPhoneVerificationCode(value);
                                        setPhoneVerificationError(null);
                                      }}
                                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                                      placeholder="6-digit code"
                                    />
                                    <button
                                      type="submit"
                                      disabled={confirmingPhoneCode}
                                      className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {confirmingPhoneCode ? 'Verifying…' : 'Confirm'}
                                    </button>
                                  </div>
                                  {phoneVerificationError && (
                                    <p className="mt-1 text-xs text-rose-500">{phoneVerificationError}</p>
                                  )}
                                  {fieldValues.phone?.trim() && (
                                    <p className="mt-1 text-xs text-neutral-500">
                                      Sent to {maskPhoneNumber(fieldValues.phone)}
                                    </p>
                                  )}
                                </motion.form>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-800 md:text-base">
                            {typeof fieldValues[key as keyof typeof fieldValues] === 'string' &&
                            (fieldValues[key as keyof typeof fieldValues] as string).trim()
                              ? (fieldValues[key as keyof typeof fieldValues] as string)
                              : 'Not provided'}
                          </p>

                        )}
                      </AnimatePresence>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setEditingField(editingField === key ? null : key)}
                      className="whitespace-nowrap text-xs text-black underline-offset-2 transition hover:underline md:text-sm"
                    >
                      {key === 'address'
                        ? fieldValues.street ||
                          fieldValues.apt ||
                          fieldValues.city ||
                          fieldValues.state ||
                          fieldValues.zip ||
                          fieldValues.country
                          ? editingField === key
                            ? 'Cancel'
                            : 'Edit'
                          : 'Add'
                        : fieldValues[key as keyof typeof fieldValues]
                        ? editingField === key
                          ? 'Cancel'
                          : 'Edit'
                        : 'Add'}
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="w-full rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg lg:w-1/2 lg:sticky lg:top-36"
            >
              <FAQ items={personalInfoFAQ} />
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        {activeSection === 'login-security' && (
          <motion.section
            key="login-security"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-8 flex w-full flex-col gap-10 pt-0 md:pt-5 lg:flex-row"
          >
            <motion.div
              variants={cardVariants}
              className="w-full rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg lg:w-1/2"
            >
              <div className="mb-4 flex items-center gap-3">
                <button
                  onClick={() => setActiveSection(null)}
                  className="rounded-full px-2 py-1 text-xs text-black transition hover:bg-neutral-100 md:text-sm"
                >
                  ←
                </button>
                <h2 className="text-base font-bold md:text-lg">Login &amp; Security</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-700 md:text-base">Password</p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setEditingField(editingField === 'password' ? null : 'password')}
                      className="text-xs text-black underline-offset-2 transition hover:underline md:text-sm"
                    >
                      {editingField === 'password' ? 'Cancel' : 'Update'}
                    </motion.button>
                  </div>
                  <p className="text-xs text-neutral-400 md:text-sm">
                    Last updated: {lastPasswordUpdateDate ? lastPasswordUpdateDate.toLocaleDateString() : 'Not available'}
                  </p>

                  <AnimatePresence initial={false} mode="wait">
                    {editingField === 'password' && (
                      <motion.div
                        key="password-edit"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4 pt-4"
                      >
                        <input
                          type="password"
                          placeholder="Current password"
                          className="w-full border-b border-neutral-300 px-2 py-2 text-sm focus:border-black focus:outline-none md:text-base"
                          id="currentPassword"
                        />
                        <input
                          type="password"
                          placeholder="New password"
                          className="w-full border-b border-neutral-300 px-2 py-2 text-sm focus:border-black focus:outline-none md:text-base"
                          id="newPassword"
                        />
                        <input
                          type="password"
                          placeholder="Confirm new password"
                          className="w-full border-b border-neutral-300 px-2 py-2 text-sm focus:border-black focus:outline-none md:text-base"
                          id="confirmNewPassword"
                        />
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={async () => {
                            const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement).value;
                            const newPassword = (document.getElementById('newPassword') as HTMLInputElement).value;
                            const confirmNewPassword = (document.getElementById('confirmNewPassword') as HTMLInputElement).value;

                            if (!currentPassword || !newPassword || newPassword !== confirmNewPassword) {
                              toast.error('Please check your input fields.');
                              return;
                            }

                            try {
                              await axios.put('/api/users/update-password', {
                                currentPassword,
                                newPassword,
                                confirmPassword: confirmNewPassword,
                              });
                              setEditingField(null);
                              toast.success('Password updated successfully!', {
                                iconTheme: {
                                  primary: '#2200ffff',
                                  secondary: '#fff',
                                },
                              });
                            } catch (error) {
                              console.error('Error updating password:', error);
                              toast.error('Unable to update password.');
                            }
                          }}
                          className="w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
                        >
                          Save password
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-700 md:text-base">Two-factor authentication</p>
                    <span className="text-xs text-neutral-500 md:text-sm">Coming soon</span>
                  </div>
                  <p className="text-xs text-neutral-500 md:text-sm">
                    Add an extra layer of protection to keep your account secure.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-700 md:text-base">Deactivate account</p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setConfirmDeactivation(true)}
                      className="text-xs text-red-600 underline-offset-2 transition hover:underline md:text-sm"
                    >
                      Deactivate
                    </motion.button>
                  </div>
                  <p className="text-xs text-neutral-500 md:text-sm">
                    Temporarily deactivate your account. You can reactivate it anytime by logging back in.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={cardVariants}
              className="w-full rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg lg:w-1/2 lg:sticky lg:top-36"
            >
              <FAQ
                items={[
                  {
                    question: 'How often should I update my password?',
                    answer:
                      'We recommend updating your password every few months and avoiding passwords you use on other platforms.',
                  },
                  {
                    question: 'Why enable two-factor authentication?',
                    answer:
                      'Two-factor authentication adds a second verification step, making it much harder for intruders to gain access.',
                  },
                  {
                    question: 'What happens if I deactivate my account?',
                    answer:
                      'Your listings and trips will pause immediately. You can reactivate the account simply by signing back in.',
                  },
                ]}
              />
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
        {activeSection === 'payments' && (
          <motion.section
            key="payments"
            id="payments-section"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
          >
            <div className="mt-8 pt-0 md:pt-5 flex flex-col lg:flex-row gap-10 w-full items-start">
              <div className="w-full lg:w-1/2 bg-white rounded-xl shadow-md hover:shadow-lg p-6">

              {/* Header */}
                <div className="flex justify-between items-center mb-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveSection(null)}
                    className="text-sm text-black bg-transparent hover:bg-neutral-100 rounded-full py-1 px-2 transition"
                  >
                    ←
                  </button>
                  <h2 className="text-md md:text-lg font-bold">{paymentsTitle}</h2>
                </div>
              </div>
                {/* Tabs */}
                {viewRole === 'promoter' && (
                <div className="flex gap-4 mb-6">
                  {/* <button
                    className={`px-4 py-2 rounded-lg ${activePaymentTab === 'payout' ? 'bg-black text-white' : 'border'}`}
                    onClick={() => setActivePaymentTab('payout')}
                  >
                    Payout
                  </button> */}
                </div>
                )}

                {/* Tabs */}
                {viewRole === 'customer' && (
                <div className="flex gap-4 mb-6">
                  {/* <button
                    className={`px-4 py-2 rounded-lg ${activePaymentTab === 'payment' ? 'bg-black text-white' : 'border'}`}
                    onClick={() => setActivePaymentTab('payment')}
                  >
                    Payment
                  </button> */}
                </div>
                )}

                {activePaymentTab === 'payment' && viewRole === 'customer' && (
                  <>
                    <Heading title="Payment Method" subtitle="Manage your cards and payment methods" />
                    {!savedCard ? (
                      <button
                        className="mt-4 px-4 border py-2 bg-black text-white transition hover:bg-neutral-800 rounded-lg"
                        onClick={() => setShowCardModal(true)}
                      >
                        Add Card
                      </button>
                    ) : (
                      <div className="flex gap-4 mt-4">
                      {/* Edit Button */}
                      <button
                        className="px-4 py-2 shadow-sm hover:shadow-md text-black rounded-lg hover:bg-neutral-100 transition"
                        onClick={() => setShowCardModal(true)}
                      >
                        Edit Card
                      </button>

                      {/* Delete Button */}
                      <button
                        className="px-4 py-2 shadow-sm hover:shadow-md text-black rounded-xl hover:bg-black hover:text-white transition"
                        onClick={() => setShowConfirmDelete(true)}
                      >
                        Delete Card
                      </button>
                    </div>
                    )}

                    {savedCard && (
                    <div
                      className="relative w-full max-w-sm h-56 perspective mt-6"
                      onClick={() => setIsFlipped(prev => !prev)}
                    >
                      <div
                        className={`absolute w-full h-full sm:h-full h-[90%] duration-700 transform transition-transform preserve-3d ${
                          isFlipped ? 'rotate-y-180' : ''
                        }`}
                        >
                        {/* FRONT SIDE */}
                        {/* <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                          <p className="text-lg font-semibold tracking-widest">Payment Card</p>
                        </div> */}
                        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                          <Image
                            src={
                              savedCard?.number?.replace(/\D/g, '').startsWith('4')
                                ? '/images/Visa.png'
                                : savedCard?.number?.replace(/\D/g, '').startsWith('5')
                                ? '/images/MasterCard.png'
                                : savedCard?.number?.replace(/\D/g, '').startsWith('3')
                                ? '/images/americanexpress.png'
                                // : savedCard?.number?.replace(/\D/g, '').startsWith('6')
                                // ? '/images/Discover.png'
                                : '/images/card.png'
                            }
                            alt="Card Type"
                            className="w-24 h-auto object-contain"
                            width={64}
                            height={32}
                          />
                        </div>


                        {/* BACK SIDE */}
                        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-between">
                          <div className="text-sm tracking-wider text-gray-400">Encrypted</div>

                          <div className="text-xl font-mono tracking-widest text-center my-4">
                            **** **** **** {savedCard.number.slice(-4)}
                          </div>

                        </div>
                      </div>
                    </div>
                  )}
                    <div className="mt-10">
                      <Heading
                        title="Voucher"
                        subtitle=""
                      />
                    {userCoupon && 
                      <p className="mt-2 text-lg text-neutral-700 gap-2">
                          Active coupon:{' '}
                          <span className="inline-block px-3 py-1 border border-dashed border-black rounded-lg bg-neutral-50">
                            {userCoupon}
                          </span>
                        </p>
                      }

                  <AnimatePresence initial={false} mode="wait">
                    {showCouponInput ? (
                      <motion.div
                        key="couponInput"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="mt-4"
                      >
                       <div className="relative w-full px-1">
                        <input
                          id="coupon"
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder=" "
                          className="peer w-full shadow-md border border-neutral-300 rounded-lg px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <label
                          htmlFor="coupon"
                          className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                            duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                            peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                        >
                          Enter your coupon code
                        </label>
                      </div>
                        <div className="flex gap-2 mt-5">
                          <button
                            className="bg-black text-white px-4 py-1 rounded-lg hover:bg-neutral-800 transition"
                            onClick={async () => {
                              if (!couponCode) return toast.error('Enter a coupon code');
                              try {
                                const res = await axios.post('/api/coupon/addcoupon', { code: couponCode });
                                toast.success(`Coupon "${couponCode}" applied!`, {
                                  iconTheme: {
                                    primary: '#2200ffff',
                                    secondary: '#fff',
                                  }
                                });
                                setCouponCode('');
                                setShowCouponInput(false);
                                setUserCoupon(couponCode);
                              } catch (err: any) {
                                // toast.error(err?.response?.data || 'Coupon invalid or expired');
                                const errorMsg = err?.response?.data;
                                toast.error(typeof errorMsg === 'string' ? errorMsg : errorMsg?.error || 'Coupon invalid or expired');
                              }
                            }}
                          >
                            Apply
                          </button>
                          <button
                            className="border px-4 py-1 rounded-lg hover:bg-neutral-100 hover:text-black transition"
                            onClick={() => setShowCouponInput(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="addCouponBtn"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 text-sm underline text-black"
                        onClick={() => setShowCouponInput(true)}
                      >
                        {userCoupon ? 'Edit Coupon' : 'Add Coupon'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                    </div>

                  </>
                )}

                {activePaymentTab === 'payout' && ['promoter', 'host'].includes(viewRole) && (
                  <>
                  <div className="pt-4">
                    <Heading title="Withdrawal Method" subtitle="Manage your withdrawal credentials" />
                    </div>

                    {savedPayout ? (
                      <>
                        {/* Flip Card */}
                        <div
                          className="relative w-full max-w-sm h-56 perspective mt-6 cursor-pointer"
                          onClick={() => setIsFlipped(prev => !prev)}
                        >
                          <div
                            className={`absolute w-full h-full sm:h-full h-[90%] duration-700 transform transition-transform preserve-3d ${
                              isFlipped ? 'rotate-y-180' : ''
                            }`}
                            >
                            {/* FRONT */}
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl flex items-center justify-center">
                              {/* <p className="text-lg font-bold tracking-widest uppercase border-b border-white">
                                {savedPayout.method}
                              </p> */}
                              <Image
                                  src={
                                    savedPayout.method === 'paypal'
                                      ? '/images/paypal.png'
                                      : savedPayout.method === 'iban'
                                      ? '/images/iban.png'
                                      : savedPayout.method === 'revolut'
                                      ? '/images/revolut.png'
                                      : savedPayout.method === 'card' &&
                                        savedPayout.number?.replace(/\D/g, '').startsWith('4')
                                      ? '/images/Visa.png'
                                      : savedPayout.method === 'card' &&
                                        savedPayout.number?.replace(/\D/g, '').startsWith('5')
                                      ? '/images/MasterCard.png'
                                      : savedPayout.method === 'card' &&
                                        savedPayout.number?.replace(/\D/g, '').startsWith('3')
                                      ? '/images/americanexpress.png'
                                      // : savedPayout.method === 'card' &&
                                      //   savedPayout.number?.replace(/\D/g, '').startsWith('6')
                                      // ? '/images/Discover.png'
                                      : '/images/card.png'
                                  }
                                  alt={savedPayout.method}
                                  className="w-24 h-auto object-contain"
                                  width={64}
                                  height={32}
                                />
                            </div>

                            {/* BACK SIDE */}
                            <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl rotate-y-180 p-6 flex flex-col justify-center items-center gap-4">
                              <p className="text-xs tracking-wider text-gray-400">Credential</p>
                              <p className="text-lg font-mono text-center">
                                {savedPayout.method === 'paypal'
                                  ? savedPayout.number
                                  : savedPayout.number && savedPayout.number.length >= 8
                                  ? `${savedPayout.number.slice(0, 4)} ${'*'.repeat(8)} ${savedPayout.number.slice(-4)}`
                                  : '****'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Delete Button Only */}
                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={() => setShowConfirmDeletePayout(true)}
                            className="border px-4 py-2 rounded-lg hover:bg-neutral-100 transition"
                          >
                            Delete Method
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Select Method */}
                        <div className="mt-4">
                          <label className="block mb-2 font-semibold">Withdrawal Method</label>
                          <select
                            value={payoutInfo.method}
                            onChange={(e) => setPayoutInfo({ ...payoutInfo, method: e.target.value })}
                            className="w-full border border-neutral-300 rounded-md px-4 py-3"
                          >
                            <option value="card">Credit/Debit Card</option>
                            <option value="iban">IBAN</option>
                            <option value="revolut">Revolut</option>
                            <option value="paypal">PayPal</option>
                          </select>
                        </div>

                        {/* Input with Animated Label & Icon */}
                        <div className="relative w-full mt-6">
                        <input
                            value={payoutInfo.number}
                            onChange={(e) => {
                              let val = e.target.value;

                              // format for card/revolut
                              if (['card', 'revolut'].includes(payoutInfo.method)) {
                                val = val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
                              }

                              // format for iban
                              if (payoutInfo.method === 'iban') {
                                val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 27);
                              }

                              setPayoutInfo({ ...payoutInfo, number: val });
                            }}
                            className="peer w-full border border-neutral-300 rounded-lg px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black pr-14"
                          />

                          <label
                            htmlFor="payoutInput"
                            className="absolute left-4 top-3 text-base text-neutral-500 transition-all duration-200 ease-in-out
                              peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-neutral-400
                              peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                          >
                            {payoutInfo.method === 'iban'
                              ? 'IBAN (Starts with IT)'
                              : payoutInfo.method === 'paypal'
                              ? 'PayPal username or phone'
                              : payoutInfo.method === 'revolut'
                              ? 'Revolut 16-digit number'
                              : 'Card number'}
                          </label>

                          {/* Right-side Logo */}
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Image
                              src={
                                payoutInfo.method === 'paypal'
                                  ? '/images/paypal.png'
                                  : payoutInfo.method === 'iban'
                                  ? '/images/iban.png'
                                  : payoutInfo.method === 'revolut'
                                  ? '/images/revolut.png'
                                  : payoutInfo.number.replace(/\D/g, '').startsWith('4')
                                  ? '/images/Visa.png'
                                  : payoutInfo.number.replace(/\D/g, '').startsWith('5')
                                  ? '/images/MasterCard.png'
                                  : payoutInfo.number.replace(/\D/g, '').startsWith('3')
                                  ? '/images/americanexpress.png'
                                  : '/images/card4.png'
                              }
                              alt="Method"
                              className="w-8 h-5 object-contain"
                              width={50}
                              height={50}
                            />
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={handleSavePayoutMethod}
                            className="bg-black text-white px-4 py-2 rounded-lg"
                          >
                            Save Payout
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="w-full lg:w-1/2 lg:sticky lg:top-32 px-5 md:px-20 mt-0 md:mt-5">
                <FAQ items={paymentsFAQ} />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

          {showConfirmDeletePayout && (
            <ConfirmPopup
              title="Delete Withdrawal Method"
              message="Are you sure you want to delete your withdrawal method?"
              onCancel={() => setShowConfirmDeletePayout(false)}
              onConfirm={async () => {
                try {
                  await handleDeletePayoutMethod();
                } finally {
                  setShowConfirmDeletePayout(false);
                }
              }}
            />
          )}

          {showConfirmDelete && (
            <ConfirmPopup
              title="Delete Card"
              message="Are you sure you want to delete your saved card?"
              onCancel={() => setShowConfirmDelete(false)}
              onConfirm={async () => {
                try {
                  await axios.delete('/api/users/delete-card');
                  setSavedCard(null);
                  setShowConfirmDelete(false);
                } catch (err) {
                  console.error('Failed to delete card', err);
                  setShowConfirmDelete(false);
                }
              }}
            />
          )}

          {popupMessage && (
            <ConfirmPopup
              title="Notice"
              message={popupMessage}
              hideCancel
              confirmLabel="OK"
              onConfirm={() => setPopupMessage(null)}
            />
          )}

          {popupMessage && (
            <ConfirmPopup
              title="Notice"
              message={popupMessage}
              hideCancel
              confirmLabel="OK"
              onConfirm={() => setPopupMessage(null)}
            />
          )}

          {confirmDeactivation && (
            <ConfirmPopup
              title="Confirm Deactivation"
              message="Are you sure you want to deactivate your account? This action is irreversible."
              confirmLabel="Yes, Deactivate"
              cancelLabel="Cancel"
              onConfirm={async () => {
                try {
                  await axios.delete('/api/users/deactivate');
                  window.location.href = '/'; // Redirect after deactivation
                } catch (err) {
                  // setPopupMessage('Failed to deactivate account.');
                  toast.error('Failed to deactivate account.');
                } finally {
                  setConfirmDeactivation(false);
                }
              }}
              onCancel={() => setConfirmDeactivation(false)}
            />
          )}

          {popupMessage && (
            <ConfirmPopup
              title="Notice"
              message={popupMessage}
              hideCancel
              confirmLabel="OK"
              onConfirm={() => setPopupMessage(null)}
            />
          )}

      <AnimatedModal isOpen={showCardModal} onClose={() => setShowCardModal(false)}>
      <div className="flex flex-col max-h-[60vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Card Details</h3>
          <button onClick={() => setShowCardModal(false)} className="text-sm">✕</button>
        </div>

          {cardInfo.method === 'card' && (
            <>
              <div className="flex flex-row gap-1 items-center">
                <Image width={50} height={50} src="/images/Visa.png" alt="Visa" className="w-10" />
                <Image width={50} height={50} src="/images/MasterCard.png" alt="MasterCard" className="w-8" />
                <Image width={50} height={50} src="/images/americanexpress.png" alt="AMEX" className="w-6" />
              </div>

                <div className="overflow-y-auto mt-2 mb-4 space-y-4 h-[40vh] sm:h-[20vh] md:h-auto">
                  {/* Card Number with floating label */}
                  <div className="relative w-full mb-4 px-1 pt-1">
                    <input
                      type="text"
                      id="cardNumber"
                      name="number"
                      placeholder=" "
                      value={cardInfo.number}
                      onChange={(e) => {
                        const formatted = e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 16)
                          .replace(/(.{4})/g, '$1 ')
                          .trim();
                        setCardInfo({ ...cardInfo, number: formatted });
                        setCardType(detectCardType(formatted));
                      }}
                      className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black pr-14"
                    />
                    <label
                      htmlFor="cardNumber"
                      className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                        duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                        peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                    >
                      Card number
                    </label>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Image
                        src={
                          cardInfo.number.trim() === ''
                            ? '/images/card4.png'
                            : `/images/${cardType || 'card'}.png`
                        }
                        alt="Card Type"
                        className="w-8 h-5 object-contain"
                        width={50}
                        height={50}
                      />
                    </div>
                  </div>

                  {/* Expiration & CVV */}
                  {/* <div className="flex gap-4 mb-4">
                    <div className="relative w-1/2 px-1">
                      <input
                        type="text"
                        name="expiration"
                        id="cardExpiration"
                        placeholder=" "
                        value={cardInfo.expiration}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (val.length >= 3) val = `${val.slice(0, 2)}/${val.slice(2)}`;
                          setCardInfo({ ...cardInfo, expiration: val });
                        }}
                        className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <label
                        htmlFor="cardExpiration"
                        className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                          duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                          peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                      >
                        (MM/YY)
                      </label>
                    </div>

                    <div className="relative w-1/2 px-1">
                      <input
                        type="text"
                        name="cvv"
                        id="cardCVV"
                        placeholder=" "
                        value={cardInfo.cvv}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setCardInfo({ ...cardInfo, cvv: val });
                        }}
                        className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                      />
                      <label
                        htmlFor="cardCVV"
                        className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                          duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                          peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                      >
                        CVV
                      </label>
                    </div>
                  </div> */}

                  {/* Billing Address */}
                  <div className="space-y-4 mb-4">
                    <h3 className="text-md font-semibold ml-2">Billing Address</h3>

                    {[
                      { name: 'address', label: 'Street address' },
                      { name: 'apt', label: 'Apt or suite number' },
                      { name: 'city', label: 'City' },
                      { name: 'state', label: 'State' },
                      { name: 'zip', label: 'ZIP Code' }
                    ].map(({ name, label }) => (
                      <div key={name} className="relative w-full px-1">
                        <input
                          type="text"
                          name={name}
                          id={`billing-${name}`}
                          placeholder=" "
                          value={cardInfo[name as keyof typeof cardInfo] as string}
                          onChange={handleCardChange}
                          className="peer w-full border border-neutral-300 rounded-xl px-4 pt-6 pb-2 text-base placeholder-transparent focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <label
                          htmlFor={`billing-${name}`}
                          className="absolute left-4 top-3 text-base text-neutral-500 transition-all
                            duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                            peer-placeholder-shown:text-neutral-400 peer-focus:top-2 peer-focus:text-sm peer-focus:text-black"
                        >
                          {label}
                        </label>
                      </div>
                    ))}

                    <div className="px-1">
                      <CountrySelect
                        value={cardInfo.country}
                        onChange={(value) => setCardInfo({ ...cardInfo, country: value })}
                      />
                    </div>
                  </div>
                  </div>

                  <button
                    className="bg-black text-white px-4 py-3 rounded-xl w-full hover:bg-neutral-800 transition"
                    onClick={async () => {
                      try {
                        if (savedCard) {
                          await axios.delete('/api/users/delete-card');
                        }

                        const payload = { ...cardInfo };
                        await axios.post('/api/users/save-card', payload);
                        setCardUpdated(prev => !prev);
                        setShowCardModal(false);

                        // Immediately sync card address to user's profile address
                        await axios.put('/api/users/profile-info', {
                          address: JSON.stringify({
                            street: cardInfo.address,
                            apt: cardInfo.apt,
                            city: cardInfo.city,
                            state: cardInfo.state,
                            zip: cardInfo.zip,
                            country: cardInfo.country,
                          }),
                        });

                        const cardRes = await axios.get('/api/users/get-card');
                        const CARD_SECRET_KEY = process.env.CARD_SECRET_KEY || '';
                        const decrypt = (text: string) =>
                          CryptoJS.AES.decrypt(text, CARD_SECRET_KEY).toString(CryptoJS.enc.Utf8);

                        setSavedCard({
                          number: decrypt(cardRes.data.number),
                          // expiration: decrypt(cardRes.data.expiration),
                          // cvv: decrypt(cardRes.data.cvv),
                          name: decrypt(cardRes.data.name),
                        });

                        // setPopupMessage('Card saved successfully!');
                        toast.success('Card saved successfully!', {
                          iconTheme: {
                              primary: '#2200ffff',
                              secondary: '#fff',
                          }
                        });
                      } catch (err) {
                        console.error(err);
                        // setPopupMessage('Failed to save card. Please try again.');
                        toast.error('Failed to save card. Please try again.');
                      }
                    }}
                  >
                    Save Card
                  </button>
                </>
              )}
            </div>
        </AnimatedModal>
  
      {/* ✅ SECTION: DEFAULT OVERVIEW */}
      <AnimatePresence initial={false} mode="wait">
        {!activeSection && (
          <motion.div
            key="overview"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-10"
          >
            <motion.div
              variants={cardVariants}
              className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 relative z-0"
            >
              {[
                {
                  sectionKey: 'personal-info',
                  icon: <CgUserlane />,
                  title: 'Personal Info',
                  description: 'Edit your name, phone number, and more',
                },
                {
                  sectionKey: 'login-security',
                  icon: <MdOutlineSecurity />,
                  title: 'Login & Security',
                  description: 'Manage your password and account access',
                },
                {
                  sectionKey: 'payments',
                  icon: <RiSecurePaymentLine />,
                  title: paymentsTitle,
                  description: 'View and update your withdrawal methods',
                },
              ].map(({ sectionKey, icon, title, description }) => (
                <motion.button
                  key={sectionKey}
                  type="button"
                  onClick={() => setActiveSection(sectionKey)}
                  variants={cardVariants}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-full flex-col rounded-2xl bg-white p-6 text-left shadow-md transition hover:shadow-lg"
                >
                  <div className="text-4xl text-black">{icon}</div>
                  <p className="mt-4 text-lg font-semibold text-neutral-900">{title}</p>
                  <p className="text-sm text-neutral-600 md:text-base">{description}</p>
                </motion.button>
              ))}
            </motion.div>

            {viewRole === 'promoter' && (
              <motion.div
                variants={cardVariants}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                  <p className="text-lg font-semibold text-neutral-900">Referral Activities</p>
                  <p className="mt-2 text-sm text-neutral-600 md:text-base">
                    Performance and earnings overview — renewed twice a month.
                  </p>

                  <div className="mt-4">
                    <FilterPromoterAnalytics
                      filter={promoterActivityFilter}
                      selectedDate={promoterActivityDate}
                      onFilterChange={handlePromoterFilterChange}
                      onDateChange={setPromoterActivityDate}
                      yearOptions={promoterYearOptions}
                    />
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                      <span className="font-medium">Total Books</span>
                       <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`${promoterActivityFilter}-${promoterPeriodKey}-bookings-${promoterActivityTotals.bookings ?? 0}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="text-lg font-semibold text-black inline-block"
                        >
                          {promoterActivityTotals.bookings}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                      <span className="font-medium">Total Revenue</span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`${promoterActivityFilter}-${promoterPeriodKey}-revenue-${promoterActivityTotals.revenue ?? 0}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="text-lg font-semibold text-black inline-block"
                        >
                          {formatConverted(promoterActivityTotals.revenue, baseCurrency)}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">Pre-Withdrawal Revenue</p>
                    <p className="mt-2 text-sm text-neutral-600 md:text-base">
                      Earning 10% from each referral booking made through your code.
                    </p>
                  </div>

                  <div className="flex items-center justify-center rounded-xl bg-neutral-50 p-10 md:h-52">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={`${promoterActivityFilter}-${promoterPeriodKey}-prewithdraw-${promoterActivityTotals.revenue ?? 0}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="text-3xl font-semibold text-black"
                      >
                        {formatConverted((promoterActivityTotals.revenue || 0) * 0.1, baseCurrency)}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                      <span className="font-medium">QR Code Scanned</span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`${promoterActivityFilter}-${promoterPeriodKey}-qr-${promoterActivityQrScans ?? 0}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="text-lg font-semibold text-black inline-block"
                        >
                          {promoterActivityQrScans}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                  <p className="text-lg font-semibold text-neutral-900">Withdrawal Method</p>
                  <p className="mt-2 text-sm text-neutral-600 md:text-base">
                    Deposits processed twice per month. You can check your payout history{' '}
                    <button
                      type="button"
                      onClick={() => setShowPayoutHistory(true)}
                      className="inline-flex items-center text-black underline underline-offset-4 transition hover:opacity-80"
                    >
                      here
                    </button>
                    .
                  </p>

                  {savedPayout ? (
                    <div
                      className="relative mt-6 h-56 w-full max-w-sm cursor-pointer perspective"
                      onClick={() => setIsFlipped((prev) => !prev)}
                    >
                      <div
                        className={`absolute h-full w-full transform rounded-2xl transition-transform duration-700 preserve-3d ${
                          isFlipped ? 'rotate-y-180' : ''
                        }`}
                      >
                        <div className="absolute flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white backface-hidden">
                          <Image
                            src={
                              savedPayout.method === 'paypal'
                                ? '/images/paypal.png'
                                : savedPayout.method === 'iban'
                                ? '/images/iban.png'
                                : savedPayout.method === 'revolut'
                                ? '/images/revolut.png'
                                : savedPayout.method === 'card' &&
                                  savedPayout.number?.replace(/\D/g, '').startsWith('4')
                                ? '/images/Visa.png'
                                : savedPayout.method === 'card' &&
                                  savedPayout.number?.replace(/\D/g, '').startsWith('5')
                                ? '/images/MasterCard.png'
                                : savedPayout.method === 'card' &&
                                  savedPayout.number?.replace(/\D/g, '').startsWith('3')
                                ? '/images/americanexpress.png'
                                : '/images/card.png'
                            }
                            alt={savedPayout.method}
                            className="h-auto w-24 object-contain"
                            width={64}
                            height={32}
                          />
                        </div>

                        <div className="absolute flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white backface-hidden rotate-y-180">
                          <p className="text-xs tracking-wider text-gray-400">Credentials</p>
                          <p className="text-center text-lg font-mono">
                            {savedPayout.method === 'paypal'
                              ? savedPayout.number
                              : savedPayout.number && savedPayout.number.length >= 8
                              ? `${savedPayout.number.slice(0, 4)} ${'*'.repeat(8)} ${savedPayout.number.slice(-4)}`
                              : '****'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
                      <p>Withdrawal method is not provided</p>
                      <button
                        onClick={() => {
                          setActiveSection('payments');
                          setActivePaymentTab('payout');
                          const section = document.getElementById('payments-section');
                          if (section) section.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-sm font-medium text-black underline"
                      >
                        Go to Withdraw
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

           {/* <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-[10px] font-semibold tracking-[0.28em] text-neutral-500">
              VIN POINT
            </span>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openVinvinModal(); // uses host analytics as default source
              }}
              className="rounded-full bg-gradient-to-r from-blue-200 to-cyan-200 px-4 py-1 text-xs font-semibold text-white shadow-md transition hover:bg-black"
            >
              BOOST RELEVANCE
            </button>
          </div> */}

            {viewRole === 'host' && hostAnalytics && (
              <motion.div variants={cardVariants} className="mt-6">
                <PartnershipCommision
                  punti={hostAnalytics.punti}
                  puntiShare={hostAnalytics.puntiShare}
                  puntiLabel={hostAnalytics.puntiLabel}
                  partnerCommission={effectiveHostAnalytics.partnerCommission}
                  platformRelevance={effectiveHostAnalytics.platformRelevance}
                  maxPointValue={MAX_PARTNER_POINT_VALUE}
                  minCommission={MIN_PARTNER_COMMISSION}
                  maxCommission={MAX_PARTNER_COMMISSION}
                  onCommissionChange={handleCommissionUpdate}
                  loading={updatingCommission}
                  currentUserEmail={currentUserEmail}
                  commissionChangesUsed={currentUser.partnerCommissionChangeCount}
                  partnerCommissionChangeWindowStart={currentUser.partnerCommissionChangeWindowStart}
                  commissionChangesLimit={1}
                />

              </motion.div>
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

            {viewRole === 'host' && (
              <motion.div
                variants={cardVariants}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                  <p className="text-lg font-semibold text-neutral-900">Booking Activity</p>
                  <p className="mt-2 text-sm text-neutral-600 md:text-base">
                    Earnings and bookings overview — renewed twice a month.
                  </p>

                  <div className="mt-4">
                    <FilterHostAnalytics
                      filter={hostActivityFilter}
                      selectedDate={hostActivityDate}
                      onFilterChange={handleHostFilterChange}
                      onDateChange={setHostActivityDate}
                      yearOptions={hostYearOptions}
                    />
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                      <span className="font-medium">Total Bookings</span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`${hostActivityFilter}-${hostPeriodKey}-bookings-${hostActivityTotals.bookings ?? 0}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="text-lg font-semibold text-black inline-block"
                        >
                          {/* {effectiveHostAnalytics.totalBooks ?? 0} */}
                          {hostActivityTotals.bookings ?? 0}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                      <span className="font-medium">Total Revenue</span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={`${hostActivityFilter}-${hostPeriodKey}-revenue-${hostActivityTotals.revenue ?? 0}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="text-lg font-semibold text-black inline-block"
                        >
                          {formatConverted(hostActivityTotals.revenue ?? 0, hostCurrency)}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    {/* <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-800 shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">Pre-Withdrawal Revenue</span>
                        <span className="text-xs text-neutral-500">
                          Based on your {hostFilterLabel} totals and current commission share
                        </span>
                      </div>
                      <span className="text-lg font-semibold text-black">
                        {formatConverted(hostPreWithdrawalValue, hostCurrency)}
                      </span>
                    </div> */}
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">Pre-Withdrawal Revenue</p>
                    <p className="mt-2 text-sm text-neutral-600 md:text-base">
                      As a host, your partnership commission is {Math.round(effectiveHostAnalytics.partnerCommission)}%,
                      giving you {Math.round(hostRevenueShare * 100)}% of each booking before withdrawal.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-col items-center justify-center rounded-xl bg-neutral-50 p-10 text-center md:h-52">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={`${hostActivityFilter}-${hostPeriodKey}-prewithdraw-${hostPreWithdrawalValue * hostRevenueShare}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="text-3xl font-semibold text-black"
                      >
                        {/* {formatConverted((hostAnalytics?.totalRevenue || 0) * 0.9)} */}
                        {formatConverted(hostPreWithdrawalValue * hostRevenueShare)}
                      </motion.p>
                    </AnimatePresence>
                    <p className="mt-3 text-xs text-neutral-500">
                      Calculated from your {hostFilterLabel} revenue snapshot using the commission applied when each booking was
                      made.
                    </p>
                    <div className="mt-4 text-center text-sm text-neutral-700">
                      <p className="font-semibold">Partner commission for {hostFilterLabel}</p>
                      <p className="text-xs text-neutral-500">
                        {Math.round(effectiveHostAnalytics.partnerCommission)}% applied to bookings in
                        this period.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg">
                  <p className="text-lg font-semibold text-neutral-900">Withdrawal Method</p>
                  <p className="mt-2 text-sm text-neutral-600 md:text-base">
                    Deposits processed twice per month. You can check your payout history{' '}
                    <button
                      type="button"
                      onClick={() => setShowPayoutHistory(true)}
                      className="inline-flex items-center text-black underline underline-offset-4 transition hover:opacity-80"
                    >
                      here
                    </button>
                    .
                  </p>

                  {savedPayout ? (
                    <div
                      className="relative mt-6 h-56 w-full max-w-sm cursor-pointer perspective"
                      onClick={() => setIsFlipped((prev) => !prev)}
                    >
                      <div
                        className={`absolute h-full w-full transform rounded-2xl transition-transform duration-700 preserve-3d ${
                          isFlipped ? 'rotate-y-180' : ''
                        }`}
                      >
                        <div className="absolute flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white backface-hidden">
                          <Image
                            src={
                              savedPayout.method === 'paypal'
                                ? '/images/paypal.png'
                                : savedPayout.method === 'iban'
                                ? '/images/iban.png'
                                : savedPayout.method === 'revolut'
                                ? '/images/revolut.png'
                                : savedPayout.method === 'card' &&
                                  savedPayout.number?.replace(/\D/g, '').startsWith('4')
                                ? '/images/Visa.png'
                                : savedPayout.method === 'card' &&
                                  savedPayout.number?.replace(/\D/g, '').startsWith('5')
                                ? '/images/MasterCard.png'
                                : savedPayout.method === 'card' &&
                                  savedPayout.number?.replace(/\D/g, '').startsWith('3')
                                ? '/images/americanexpress.png'
                                : '/images/card.png'
                            }
                            alt={savedPayout.method}
                            className="h-auto w-24 object-contain"
                            width={64}
                            height={32}
                          />
                        </div>

                        <div className="absolute flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white backface-hidden rotate-y-180">
                          <p className="text-xs tracking-wider text-gray-400">Credentials</p>
                          <p className="text-center text-lg font-mono">
                            {savedPayout.method === 'paypal'
                              ? savedPayout.number
                              : savedPayout.number && savedPayout.number.length >= 8
                              ? `${savedPayout.number.slice(0, 4)} ${'*'.repeat(8)} ${savedPayout.number.slice(-4)}`
                              : '****'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex items-center justify-between rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
                      <p>Withdrawal method is not provided</p>
                      <button
                        onClick={() => {
                          setActiveSection('payments');
                          setActivePaymentTab('payout');
                          const section = document.getElementById('payments-section');
                          if (section) section.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-sm font-medium text-black underline"
                      >
                        Go to Withdraw
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {(viewRole === 'host' || viewRole === 'promoter') && (
              <motion.div variants={cardVariants} className="mt-2">
                <EarningsCard
                  title="What You’ve Achieved"
                  roleLabel={viewRole === 'host' ? 'Host' : 'Promoter'}
                  dailyData={earnings.daily}
                  monthlyData={earnings.monthly}
                  yearlyData={earnings.yearly}
                  revenueTotals={earnings.revenueTotals}
                  todaysProfit={earnings.todaysProfit}
                  totalEarnings={earnings.totalEarnings}
                  // hostShare={viewRole === 'host' ? 1 : hostRevenueShare}
                  sourceCurrency={earningsCurrency}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PayoutHistory
        open={showPayoutHistory}
        onClose={() => setShowPayoutHistory(false)}
        payouts={payoutRecords}
        baseCurrency={baseCurrency}
        formatConverted={formatConverted}
        currencySymbol={currencySymbol}
      />

      {/* Crop Modal */}
      {isCropping && uploadedImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-[90vw] h-[70vh] relative rounded-xl shadow-lg">
            <Cropper
              image={uploadedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
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
      </motion.div>

    </Container>
  );  
};

export default ProfileClient;