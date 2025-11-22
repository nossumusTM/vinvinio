'use client';

import { useCallback, useEffect, useMemo, useState, useRef, type ChangeEvent } from 'react';

import {
  MAX_PARTNER_COMMISSION,
  MIN_PARTNER_COMMISSION,
  computePuntiFromCommission,
  computePuntiShare,
  formatPuntiPercentage,
  getPuntiLabel,
  sanitizePartnerCommission,
} from "@/app/(marketplace)/constants/partner";

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
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const PartnershipCommision: React.FC<PartnershipCommisionProps> = ({
  punti,
  puntiShare,
  puntiLabel,
  partnerCommission,
  maxPointValue,
  minCommission = MIN_PARTNER_COMMISSION,
  maxCommission = MAX_PARTNER_COMMISSION,
  onCommissionChange,
  loading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCommission, setDraftCommission] = useState(() => sanitizePartnerCommission(partnerCommission));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLabelRef = useRef<string | null>(null);
  const [isBooming, setIsBooming] = useState(false);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const labelColors: Record<string, string> = {
    "TOP RATE": "bg-[#8a2be2] text-white",   // violet
    "PUMP": "bg-[#0000ff] text-white",   // neon blue
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

  const effectiveCommission = isEditing ? draftCommission : sanitizePartnerCommission(partnerCommission);
  const effectivePunti = isEditing
    ? computePuntiFromCommission(draftCommission)
    : Number.isFinite(punti)
      ? Math.max(0, Math.round(punti))
      : 0;
  const effectiveShare = isEditing
    ? computePuntiShare(effectivePunti)
    : clamp(Number.isFinite(puntiShare) ? puntiShare : 0);
    const effectiveLabel = isEditing ? getPuntiLabel(effectivePunti) : puntiLabel;
    const commissionSpread = Math.max(1, maxCommission - minCommission);
    const commissionShare = clamp((effectiveCommission - minCommission) / commissionSpread);
    const fillPercent = Math.round(commissionShare * 100);

    let labelClass = "bg-neutral-200 text-neutral-800";

    if (effectiveLabel === "TOP RATE") {
      labelClass = "bg-[#8a2be2] text-white shadow-[0_0_8px_#8a2be2]";
    }

    if (effectiveLabel === "PUMP") {
      labelClass = "bg-[#0000ff] text-white shadow-[0_0_8px_#0000ff]";
    }

  const sliderTrackStyle = useMemo(
      () => ({
        background: `linear-gradient(90deg, #0ea5e9 0%, #6366f1 ${fillPercent}%, #e5e7eb ${fillPercent}%)`,
        transition: 'background 0.35s ease',
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
    setIsEditing(true);
  }, [loading]);

  const handleSliderChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const next = sanitizePartnerCommission(Number(event.target.value));
    setDraftCommission(next);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!onCommissionChange) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSubmitting(true);
      await onCommissionChange(draftCommission);
      setIsEditing(false);
    } catch (error) {
      console.error('[PartnershipCommision] failed to update commission', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [draftCommission, onCommissionChange]);

  const disableInteractions = loading || isSubmitting;

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
          <p className="text-xs uppercase tracking-wide text-neutral-500">Partnership commission</p>
          <p className="text-3xl font-semibold text-neutral-900">
            {Math.round(effectiveCommission)}%
          </p>
        </div>
        <span
          className={`
            rounded-full px-4 py-1 text-xs font-semibold tracking-widest 
            transition-transform
            ${isBooming ? 'animate-boom' : ''}
            ${labelClass}
          `}
        >
          {effectiveLabel.toUpperCase()}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-600">
        Your listings {isEditing ? "will" : "currently"} earn a
        {" "}
        <span className="font-semibold text-neutral-900">{Math.round(effectiveCommission)}%</span> share
        {" "}
        thanks to
        {" "}
        <span className="font-semibold text-neutral-900">{effectivePunti}</span> punti gathered across approved experiences.
      </p>

      <div className="mt-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
          <span>{minCommission}%</span>
          <span>{maxCommission}%</span>
        </div>
        <input
          type="range"
          min={minCommission}
          max={maxCommission}
          step={1}
          value={effectiveCommission}
          onChange={handleSliderChange}
          disabled={!isEditing || disableInteractions}
          aria-readonly={!isEditing}
          className="mt-3 h-2 w-full appearance-none rounded-full accent-indigo-500 outline-none"
          style={sliderTrackStyle}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-neutral-600 sm:grid-cols-3" onClick={(event) => event.stopPropagation()}>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Punti score</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {effectivePunti}
            <span className="text-sm text-neutral-500"> / {maxPointValue}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Platform relevance</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">{formatPuntiPercentage(effectiveShare)}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Commission window</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            {minCommission}% – {maxCommission}%
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            You are {Math.round(commissionShare * 100)}% of the way to the top rate.
          </p>
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