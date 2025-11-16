'use client';

import { twMerge } from 'tailwind-merge';
import { FiCheckCircle, FiClock } from 'react-icons/fi';

interface VerificationBadgeProps {
  verified: boolean;
  className?: string;
  verifiedLabel?: string;
  pendingLabel?: string;
  size?: 'sm' | 'md';
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verified,
  className,
  verifiedLabel = 'Verified',
  pendingLabel = 'Pending verification',
  size = 'sm',
}) => {
  const baseClasses =
    'inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide transition-colors duration-200';

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1 text-[10px]'
    : 'px-3 py-1.5 text-xs';

  const stateClasses = verified
    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
    : 'bg-amber-100 text-amber-700 ring-1 ring-amber-300';

  return (
    <span className={twMerge(baseClasses, sizeClasses, stateClasses, className)}>
      {verified ? (
        <FiCheckCircle className="text-[12px]" />
      ) : (
        <FiClock className="text-[12px]" />
      )}
      {verified ? verifiedLabel : pendingLabel}
    </span>
  );
};

export default VerificationBadge;