"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Container from "@/app/(marketplace)/components/Container";
import useLocaleSettings from "@/app/(marketplace)/hooks/useLocaleSettings";
import VoucherCheckoutContent from "./VaucherCheckoutContent";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function VoucherCheckoutPage() {
  const { currency } = useLocaleSettings();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  useEffect(() => {
    if (!amountCents) return;

    const fetchClientSecret = async () => {
      setIsCreatingIntent(true);
      try {
        const res = await axios.post("/api/vouchers/payment-intent", {
          amount: amountCents,
          currency,
        });
        setClientSecret(res.data.clientSecret);
      } catch (error) {
        console.error("Error creating voucher payment intent", error);
        setClientSecret(null);
      } finally {
        setIsCreatingIntent(false);
      }
    };

    fetchClientSecret();
  }, [amountCents, currency]);

  return (
    <Container className="py-12">
      <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
        <VoucherCheckoutContent
          clientSecret={clientSecret}
          amountCents={amountCents}
          onAmountSubmit={setAmountCents}
          isCreatingIntent={isCreatingIntent}
        />
      </Elements>
    </Container>
  );
}