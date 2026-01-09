"use client";

import { useState } from "react";
import { Switch } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import axios from "axios";
import toast from "react-hot-toast";

interface VinVoucherPinToggleProps {
  listingId: string;
  initialPinned?: boolean;
}

const VinVoucherPinToggle = ({
  listingId,
  initialPinned = false,
}: VinVoucherPinToggleProps) => {
  const [enabled, setEnabled] = useState(initialPinned);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (next: boolean) => {
    if (!listingId) {
      toast.error("Listing is missing.");
      return;
    }
    setEnabled(next);
    setIsSaving(true);
    try {
      await axios.post(`/api/listings/${listingId}/voucher-pin`, { pinned: next });
      toast.success(next ? "Vin Voucher pinned to listing." : "Vin Voucher unpinned.");
    } catch (error) {
      console.error("Failed to update voucher pin", error);
      setEnabled(!next);
      toast.error("Failed to update Vin Voucher pin.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Pin Vin Voucher</p>
          <p className="text-xs text-neutral-500">
            Highlight gift voucher sales on this listing.
          </p>
        </div>
        <Switch
          checked={enabled}
          onChange={handleChange}
          disabled={isSaving}
          className={twMerge(
            "relative inline-flex h-6 w-11 items-center rounded-full transition",
            enabled ? "bg-indigo-600" : "bg-neutral-300",
            isSaving && "opacity-60"
          )}
        >
          <span
            className={twMerge(
              "inline-block h-4 w-4 transform rounded-full bg-white transition",
              enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </Switch>
      </div>
    </div>
  );
};

export default VinVoucherPinToggle;