'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';

import Button from '@/app/(marketplace)/components/Button';
import useCurrencyFormatter from '@/app/(marketplace)/hooks/useCurrencyFormatter';
import useLoginModal from '@/app/(marketplace)/hooks/useLoginModal';
import type { SafeListing, SafeUser } from '@/app/(marketplace)/types';

interface VinSubscriptionCardProps {
  listing: SafeListing;
  hostName?: string;
  currentUser?: SafeUser | null;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const VinSubscriptionCard = ({ listing, hostName, currentUser }: VinSubscriptionCardProps) => {
  const loginModal = useLoginModal();
  const { formatConverted } = useCurrencyFormatter();

  const [isLoading, setIsLoading] = useState(false);

  const interval = listing.vinSubscriptionInterval ?? 'monthly';
  const price = listing.vinSubscriptionPrice ?? 0;

  const intervalLabel = interval === 'yearly' ? 'year' : 'month';
  const fullIntervalLabel = interval === 'yearly' ? 'Yearly' : 'Monthly';

  const savings = useMemo(() => {
    const multiplier = interval === 'yearly' ? 12 : 1;
    const baseline = Math.max(0, (listing.price ?? 0) * multiplier);
    return Math.max(0, baseline - price);
  }, [interval, listing.price, price]);

  const handleSubscribe = async () => {
    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/subscriptions/checkout', { listingId: listing.id });
      const sessionId = response.data?.sessionId;

      if (!sessionId) {
        throw new Error('Checkout session not created');
      }

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data || 'Unable to start subscription checkout.';
      toast.error(typeof message === 'string' ? message : 'Unable to start subscription checkout.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="show"
      className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-white via-white to-neutral-50 p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">VIN Subscription</p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-900">
              {fullIntervalLabel} VIN card for {hostName ? hostName : 'this service'}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Get monthly access with a dedicated VIN card ID and priority support.
            </p>
          </div>
          <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {fullIntervalLabel}
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{formatConverted(price)}</p>
              <p className="text-xs text-neutral-500">Billed per {intervalLabel}</p>
            </div>
            {savings > 0 && (
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Save {formatConverted(savings)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            Subscription renews automatically every {intervalLabel}. Complete checkout to activate your VIN card.
          </p>
          <Button
            label={isLoading ? 'Redirecting...' : 'Subscribe'}
            onClick={handleSubscribe}
            disabled={isLoading}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default VinSubscriptionCard;
