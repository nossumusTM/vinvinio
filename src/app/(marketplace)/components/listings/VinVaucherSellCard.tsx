"use client";

import { useRouter } from "next/navigation";
import Button from "@/app/(marketplace)/components/Button";

interface VinVoucherSellCardProps {
  listingId: string;
  hostName?: string | null;
}

const VinVoucherSellCard = ({ listingId, hostName }: VinVoucherSellCardProps) => {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
          Pinned
        </p>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-700">
          Vin Voucher
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-lg font-semibold text-neutral-900">
          Sell a Vin Voucher
        </h3>
        <p className="text-sm text-neutral-600">
          Offer a gift voucher for {hostName ? `${hostName}'s` : "this"} experience.
          Buyers can redeem it later during checkout.
        </p>
      </div>

      <div className="mt-5">
        <Button
          label="Buy Vin Voucher"
          onClick={() => router.push(`/checkout/voucher?listingId=${listingId}`)}
        />
      </div>
    </div>
  );
};

export default VinVoucherSellCard;