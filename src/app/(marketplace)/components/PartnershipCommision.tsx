'use client';

import { useCallback, useEffect, useMemo, useState, useRef, type ChangeEvent } from 'react';
import axios from "axios";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AnimatePresence, motion } from "framer-motion";
import toast from 'react-hot-toast';

import {
  MAX_PARTNER_COMMISSION,
  MIN_PARTNER_COMMISSION,
  computePuntiFromCommission,
  computePuntiShare,
  formatPuntiPercentage,
  getPuntiLabel,
  sanitizePartnerCommission,
} from "@/app/(marketplace)/constants/partner";

import Counter from "./inputs/Counter";
import Modal from "./modals/Modal";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

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
        You will be charged <span className="font-semibold text-neutral-700">{amountLabel}</span> to boost your VinVin score.
      </p>
      {isConfirming && (
        <p className="text-xs text-indigo-600">Confirming payment, please wait…</p>
      )}
    </div>
  );
};

interface PartnershipCommisionProps {
  punti: number;
  puntiShare: number;
  puntiLabel: string;
  partnerCommission: number;
  platformRelevance: number;
  maxPointValue: number;
  minCommission?: number;
  maxCommission?: number;
  onCommissionChange?: (commission: number) => Promise<void> | void;
  loading?: boolean;
  currentUserEmail?: string;

  // 🔥 NEW
  commissionChangesUsed?: number;
  commissionChangesLimit?: number;
  partnerCommissionChangeWindowStart?: string | Date | null;

  // 🔥 NEW: let parent control the VinVin modal
  onOpenVinvinModal?: (payload: {
    effectivePunti: number;
    maxPointValue: number;
    puntiShare: number;
  }) => void;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const PartnershipCommision: React.FC<PartnershipCommisionProps> = ({
  punti,
  puntiShare: _puntiShare,
  puntiLabel,
  partnerCommission,
  platformRelevance,
  maxPointValue,
  minCommission = MIN_PARTNER_COMMISSION,
  maxCommission = MAX_PARTNER_COMMISSION,
  onCommissionChange,
  loading = false,
  currentUserEmail,
  commissionChangesUsed, 
  commissionChangesLimit,
  partnerCommissionChangeWindowStart,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCommission, setDraftCommission] = useState(() => sanitizePartnerCommission(partnerCommission));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLabelRef = useRef<string | null>(null);
  const [isBooming, setIsBooming] = useState(false);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const labelColors: Record<string, string> = {
    "TOP RATE": "bg-gradient-to-r from-indigo-500 to-blue-500 text-white",   // violet
    "STARTER": "bg-gradient-to-r from-blue-200 to-cyan-200 text-white",   // neon blue
    "RELEVANT": "bg-gradient-to-r from-slate-900 to-slate-700 text-white",   // neon blue
  };

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing]);

  const baseCommission = sanitizePartnerCommission(partnerCommission);
  const basePunti = Number.isFinite(punti)
    ? Math.max(0, Math.round(punti))
    : 0;
  const basePlatformRelevance = Number.isFinite(platformRelevance)
    ? Math.max(0, Math.round(platformRelevance))
    : 0;

  const effectiveCommission = isEditing ? draftCommission : baseCommission;

  // how much user moved the slider from their real commission
  const commissionDelta = effectiveCommission - baseCommission;

  // 1% commission = 0.5 VinVin score, both up and down
  const effectivePunti = isEditing
    ? Math.max(0, Math.round(basePunti + commissionDelta * 0.5))
    : basePunti;

  // ✅ commission changes platform relevance (percentage) again
  const effectivePlatformRelevance = isEditing
    ? Math.max(0, basePlatformRelevance + commissionDelta)
    : basePlatformRelevance;

  
    const getCommissionTierLabel = (commission: number): string => {
      if (commission >= 30) return "TOP RATE";
      if (commission >= 25) return "PRIME";
      if (commission >= 20) return "PREFERRED";
      if (commission >= 15) return "GROWTH";
      if (commission >= 10) return "ESSENTIAL";
      if (commission >= 5) return "STARTER";
      return "ENTRY";
    };

    const COMMISSION_LABEL_STYLES: Record<string, string> = {
      "TOP RATE": "bg-gradient-to-r from-indigo-500 to-blue-500 text-white",
      PRIME: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
      PREFERRED: "bg-gradient-to-r from-sky-500 to-emerald-500 text-white",
      GROWTH: "bg-gradient-to-r from-emerald-500 to-lime-500 text-white",
      ESSENTIAL: "bg-gradient-to-r from-cyan-400 to-sky-400 text-white",
      STARTER: "bg-gradient-to-r from-blue-200 to-cyan-200 text-slate-900",
      ENTRY: "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900",
    };

    const effectiveLabel = getCommissionTierLabel(effectiveCommission);

    const commissionSpread = Math.max(1, maxCommission - minCommission);
    const commissionShare = clamp((effectiveCommission - minCommission) / commissionSpread);
    const fillPercent = Math.round(commissionShare * 100);

        // Limit: 1 commission change per rolling 30-day window by default
    const changesLimit =
      typeof commissionChangesLimit === "number" && commissionChangesLimit > 0
        ? commissionChangesLimit
        : 1;

    const rawUsed =
      typeof commissionChangesUsed === "number" ? commissionChangesUsed : 0;

    let changesUsedInWindow = 0;
    let nextChangeDate: Date | null = null;

    if (partnerCommissionChangeWindowStart) {
      const windowStart = new Date(partnerCommissionChangeWindowStart);
      const now = new Date();

      const windowMs = 30 * 24 * 60 * 60 * 1000;
      const diffMs = now.getTime() - windowStart.getTime();

      if (diffMs >= 0 && diffMs < windowMs) {
        // we are inside the 30-day window → respect DB counter
        changesUsedInWindow = Math.min(
          changesLimit,
          Math.max(0, rawUsed),
        );

        if (changesUsedInWindow >= changesLimit) {
          // user exhausted their one allowed change → next available at end of window
          nextChangeDate = new Date(windowStart.getTime() + windowMs);
        }
      } else {
        // window expired → user can start a new window now
        changesUsedInWindow = 0;
      }
    } else {
      // no window start yet → use DB counter but clamp to limit
      changesUsedInWindow = Math.min(
        changesLimit,
        Math.max(0, rawUsed),
      );
    }

    const changesRemaining = Math.max(0, changesLimit - changesUsedInWindow);
    const noChangesLeft = changesRemaining <= 0;

    const nextChangeDateLabel =
      nextChangeDate &&
      nextChangeDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

    const labelClass =
      COMMISSION_LABEL_STYLES[effectiveLabel.toUpperCase()] ??
      "bg-neutral-200 text-neutral-800";

  const sliderTrackStyle = useMemo(
    () => ({
      background: `linear-gradient(90deg, #75abfbff 0%, #24deffff ${fillPercent}%, #e5e7eb ${fillPercent}%)`,
      transition: 'background 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
    }),
    [fillPercent],
  );

  useEffect(() => {
    // first run: just store current label, no animation
    if (!prevLabelRef.current) {
      prevLabelRef.current = effectiveLabel;
      return;
    }

    // run animation whenever the label actually changes
    if (prevLabelRef.current !== effectiveLabel) {
      setIsBooming(true);
      prevLabelRef.current = effectiveLabel;

      const timeout = setTimeout(() => setIsBooming(false), 220);
      return () => clearTimeout(timeout);
    }
  }, [effectiveLabel]);

  const handleToggle = useCallback(() => {
    if (loading) return;
    // reset slider to the user’s current stored commission when entering edit mode
    setDraftCommission(sanitizePartnerCommission(partnerCommission));
    setIsEditing(true);
  }, [loading, partnerCommission]);

  const handleSliderChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const next = sanitizePartnerCommission(Number(event.target.value));
    setDraftCommission(next);
  }, []);

  const handleSubmit = useCallback(async () => {
    // console.log('[PartnershipCommision] submit clicked', {
    //   hasHandler: !!onCommissionChange,
    //   noChangesLeft,
    //   draftCommission,
    // });

    if (!onCommissionChange) {
      setIsEditing(false);
      return;
    }

    if (noChangesLeft) {
      toast.error("You’ve reached your monthly commission change limit.");
      setIsEditing(false);
      return;
    }

    try {
      setIsSubmitting(true);
      await onCommissionChange(draftCommission);
      setIsEditing(false);
    } catch (error) {
      console.error('[PartnershipCommision] failed to update commission', error);
      toast.error("Unable to update commission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [draftCommission, onCommissionChange, noChangesLeft]);

  const disableInteractions = loading || isSubmitting;
  const progressPercent = Math.round(commissionShare * 100);

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }}
      className={`
        group relative rounded-3xl p-6 shadow-lg ring-1 ring-black/5
        transition-all duration-500
        group-hover:cursor-none
        ${isEditing 
          ? 'bg-gradient-to-br from-sky-50 via-indigo-50 to-white scale-[1.02] ring-sky-400/70 cursor-default'
          : 'bg-white hover:shadow-xl cursor-none'}
      `}
      onClick={handleToggle}
    >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Partnership commission
                </p>
                <p className="text-3xl font-semibold text-neutral-900">
                  {Math.round(effectiveCommission)}%
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
                  Monthly commission change limit
                </p>
                <p className="text-[11px] font-medium text-neutral-600">
                  {noChangesLeft ? (
                    nextChangeDateLabel ? (
                      `0 of ${changesLimit} changes available · next change available on ${nextChangeDateLabel}`
                    ) : (
                      `0 of ${changesLimit} changes available · limit reached`
                    )
                  ) : (
                    `${changesRemaining} of ${changesLimit} changes available in this period`
                  )}
                </p>
                <span
                  className={`
                    rounded-full px-4 py-1 text-xs font-semibold tracking-widest 
                    transition-transform
                    ${isBooming ? 'animate-boom' : ''}
                    ${labelClass}
                  `}
                >
                  {effectiveLabel}
                </span>
              </div>

            </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-600">
        Your listings {isEditing ? "will" : "currently"} receive a
        {" "}
        <span className="font-semibold text-neutral-900">{Math.round(effectiveCommission)}%</span> share,
        {" "}
        driven by
        {" "}
        <span className="font-semibold text-neutral-900">{effectivePlatformRelevance}%</span> platform relevance accumulated from your approved services.
      </p>

      <div 
        className="mt-6"
        onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
          <span>{minCommission}%</span>
          <span>{maxCommission}%</span>
        </div>
        <input
          type="range"
          min={minCommission}
          max={maxCommission}
          step={0.5}
          value={effectiveCommission}
          onChange={handleSliderChange}
          disabled={!isEditing || disableInteractions}
          aria-readonly={!isEditing}
          className="mt-3 h-2 w-full appearance-none rounded-full accent-indigo-500 outline-none transition-[box-shadow,transform] duration-200 ease-out"
          style={sliderTrackStyle}
        />
      </div>

            <div
        className="mt-6 grid grid-cols-1 gap-4 text-sm text-neutral-600 sm:grid-cols-2"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Platform relevance</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {effectivePlatformRelevance}%
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Commission window</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {minCommission}% – {maxCommission}%
          </p>
          {progressPercent === 100 ? (
            <p className="mt-1 text-xs text-neutral-500">
              You are {progressPercent}% of the way to the top rate. Your services appears as the most relevant across the platform.
            </p>
          ) : (
            <p className="mt-1 text-xs text-neutral-500">
              You are {progressPercent}% of the way to the top rate.
            </p>
          )}
        </div>
      </div>

      <div
        onClick={(event) => event.stopPropagation()}
        className={`pointer-events-none mt-8 flex justify-center transition-all duration-500 ${
          isEditing
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'translate-y-3 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disableInteractions || !isEditing}
          className="w-fit rounded-full bg-black px-6 py-2 text-sm font-semibold text-white shadow-lg transition-transform transition-colors duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {disableInteractions ? 'Applying...' : 'Apply changes'}
        </button>
      </div>

      <style jsx>{`
        @keyframes wave {
          0% {
            transform: translateY(0) scale(1);
            box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
          }
          50% {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 12px 24px rgba(56, 189, 248, 0.35);
          }
          100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
          }
        }

        @keyframes boom {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(0.09);   /* zoom out */
          }
          75% {
            transform: scale(1.28);  /* zoom in */
          }
          100% {
            transform: scale(1);     /* settle */
          }
        }

        :global(.animate-boom) {
          animation: boom 0.024s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #111827;
          border: 3px solid #ffffff;
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
          cursor: ${isEditing && !disableInteractions ? 'pointer' : 'default'};
          margin-top: -9px;
          transition: transform 0.2s ease;
          animation: ${isEditing && !disableInteractions ? 'wave 1.6s ease-in-out infinite' : 'none'};
        }

        input[type='range']::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #111827;
          border: 3px solid #ffffff;
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
          cursor: ${isEditing && !disableInteractions ? 'pointer' : 'default'};
          transition: transform 0.2s ease;
          animation: ${isEditing && !disableInteractions ? 'wave 1.6s ease-in-out infinite' : 'none'};
        }

        input[type='range']:active::-webkit-slider-thumb {
          transform: scale(1.05);
        }

        input[type='range']:active::-moz-range-thumb {
          transform: scale(1.05);
        }
      `}</style>

      {!isEditing && (
  <div
    className="
      pointer-events-none absolute z-40
      flex items-center justify-center
      rounded-full text-[12px] font-semibold
      bg-black/10 backdrop-blur-sm text-white
      transition-opacity duration-200
      opacity-0 group-hover:opacity-100
    "
    style={{
      width: '100px',
      height: '100px',
      transform: 'translate(-50%, -50%)',
      left: `${cursorPos.x}px`,
      top: `${cursorPos.y}px`,
    }}
  >
    UPGRADE
  </div>
)}

    </div>
  );
};

export default PartnershipCommision;