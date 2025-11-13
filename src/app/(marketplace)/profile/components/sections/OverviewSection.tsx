'use client';

import { CgUserlane } from 'react-icons/cg';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { TbUserCircle } from 'react-icons/tb';

import type { SafeUser } from '../../../types';
import ProfileSectionCard from './ProfileSectionCard';

interface OverviewSectionProps {
  currentUser: SafeUser;
  viewRole: SafeUser['role'];
  suspensionDate: Date | null;
  formatCurrency: (amount: number) => string;
  referralBookingsTotal: number;
}

const OverviewSection = ({
  currentUser,
  viewRole,
  suspensionDate,
  formatCurrency,
  referralBookingsTotal,
}: OverviewSectionProps) => {
  const statusBadge = currentUser.isSuspended ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
      <FiAlertCircle />
      Suspended {suspensionDate ? `since ${suspensionDate.toLocaleDateString()}` : ''}
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
      <FiCheckCircle />
      Account in good standing
    </span>
  );

  return (
    <ProfileSectionCard
      title="Account overview"
      description="A quick look at your current mode and account status."
      icon={<CgUserlane />}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Current mode</p>
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase text-white">
            <TbUserCircle className="text-base" />
            {viewRole === 'host' ? 'Host' : 'Guest'} mode
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Account status</p>
          {statusBadge}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Referral rewards</p>
          <p className="text-sm text-neutral-700">
            {referralBookingsTotal > 0
              ? `Total earned so far: ${formatCurrency(referralBookingsTotal)}`
              : 'Invite friends to start earning travel credit and host bonuses.'}
          </p>
        </div>
      </div>
    </ProfileSectionCard>
  );
};

export default OverviewSection;
