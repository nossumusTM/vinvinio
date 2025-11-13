'use client';

import { FiCreditCard, FiInfo } from 'react-icons/fi';
import { RiSecurePaymentLine } from 'react-icons/ri';

import ProfileSectionCard from './ProfileSectionCard';

interface ReferralBookingsSummary {
  totalCount: number;
  totalAmount: number;
}

interface PaymentsSectionProps {
  referralBookings: ReferralBookingsSummary;
  formatCurrency: (amount: number) => string;
  isHostView: boolean;
}

const PaymentsSection = ({ referralBookings, formatCurrency, isHostView }: PaymentsSectionProps) => {
  const totalAmount = formatCurrency(referralBookings.totalAmount || 0);

  return (
    <ProfileSectionCard
      title="Payments"
      description="Manage saved cards and payouts."
      icon={<FiCreditCard />}
    >
      <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-600">
        <div className="flex items-center gap-2 text-neutral-700">
          <RiSecurePaymentLine className="text-lg" />
          <span className="font-semibold">Referral earnings</span>
        </div>
        <p className="mt-3 leading-6">
          {referralBookings.totalCount > 0
            ? `You've earned ${totalAmount} across ${referralBookings.totalCount} completed referrals.`
            : 'Start sharing experiences to earn rewards when your friends book through your link.'}
        </p>
        {isHostView ? (
          <p className="mt-2 text-xs text-neutral-500">
            Referral payouts are included with your host payouts. You can update payout details from the
            host dashboard.
          </p>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">
            Switch to host mode to configure payouts and manage saved cards.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-white/40 p-4 text-xs text-neutral-500">
        <FiInfo className="text-base" />
        <span>
          Payment details are secured with industry-standard encryption. We never share your full card
          number with anyone.
        </span>
      </div>
    </ProfileSectionCard>
  );
};

export default PaymentsSection;
