"use client";

import { useMemo, useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useSearchParams } from "next/navigation";
import Button from "@/app/(marketplace)/components/Button";
import Heading from "@/app/(marketplace)/components/Heading";
import useLocaleSettings from "@/app/(marketplace)/hooks/useLocaleSettings";

interface VoucherCheckoutContentProps {
  clientSecret: string | null;
  amountCents: number | null;
  onAmountSubmit: (value: number) => void;
  isCreatingIntent: boolean;
}

const VoucherCheckoutContent = ({
  clientSecret,
  amountCents,
  onAmountSubmit,
  isCreatingIntent,
}: VoucherCheckoutContentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();
  const { currency } = useLocaleSettings();
  const [amountInput, setAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listingId = searchParams?.get("listingId");

  const formattedAmount = useMemo(() => {
    if (!amountCents) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      }).format(amountCents / 100);
    } catch {
      return `${(amountCents / 100).toFixed(2)} ${currency}`;
    }
  }, [amountCents, currency]);

  const handleAmountConfirm = () => {
    const parsed = Number(amountInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a valid voucher amount.");
      return;
    }
    setError(null);
    onAmountSubmit(Math.round(parsed * 100));
  };

  const handleSubmit = async () => {
    if (!stripe || !elements || !clientSecret) {
      setError("Payment is not ready yet.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/successPage`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl bg-white p-6 shadow-md">
      <Heading
        title="Vin Voucher Checkout"
        subtitle="Create a gift voucher for this service."
      />

      {listingId && (
        <p className="text-xs text-neutral-500">
          Listing reference: <span className="font-semibold">{listingId}</span>
        </p>
      )}

      <div className="space-y-3">
        <label className="text-sm font-semibold text-neutral-700">
          Voucher amount ({currency})
        </label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amountInput}
          onChange={(event) => setAmountInput(event.target.value)}
          className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="0.00"
        />
        <Button
          label={isCreatingIntent ? "Preparing payment..." : "Set voucher amount"}
          onClick={handleAmountConfirm}
          disabled={isCreatingIntent}
        />
      </div>

      {formattedAmount && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          Voucher total: <span className="font-semibold">{formattedAmount}</span>
        </div>
      )}

      {clientSecret && (
        <div className="space-y-4">
          <PaymentElement options={{ layout: "tabs" }} />
          <Button
            label={isSubmitting ? "Processing..." : "Pay for voucher"}
            onClick={handleSubmit}
            disabled={isSubmitting}
          />
        </div>
      )}

      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
};

export default VoucherCheckoutContent;
