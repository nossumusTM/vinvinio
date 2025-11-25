import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { SiJsonwebtokens } from "react-icons/si";
import { HiCheckCircle, HiBolt } from "react-icons/hi2";
import { RiSecurePaymentLine } from "react-icons/ri";

import Counter from "@/app/(marketplace)/components/inputs/Counter";
import Modal from "@/app/(marketplace)/components/modals/Modal";
import PaymentConfetti from "@/app/(marketplace)/components/PaymentConfetti";
import { MAX_PARTNER_POINT_VALUE } from "@/app/(marketplace)/constants/partner";
import type { SafeListing } from "@/app/(marketplace)/types";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

interface VinvinPaymentFormProps {
  clientSecret: string;
  amountLabel: string;
  onSuccess: () => Promise<void> | void;
  onError: (message: string) => void;
  registerSubmit: (handler: () => Promise<void>) => void;
}

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
    registerSubmit(async () => {
      if (!stripe || !elements) {
        onError("Payment is still initializing. Please try again in a moment.");
        return;
      }

      setIsConfirming(true);

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: "if_required",
      });

      if (result.error) {
        onError(result.error.message ?? "Payment failed. Please check your card and try again.");
      } else if (result.paymentIntent?.status === "succeeded") {
        await onSuccess();
      }

      setIsConfirming(false);
    });
  }, [elements, onError, onSuccess, registerSubmit, stripe]);

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <p className="text-xs text-neutral-500">Charge: {amountLabel}</p>
      {isConfirming && (
        <p className="text-xs text-neutral-500">Confirming payment…</p>
      )}
    </div>
  );
};

interface VinPointBoostModalProps {
  listing: SafeListing | null;
  onClose: () => void;
  onSuccess?: () => void;
  currentUserEmail?: string | null;
}

const VinPointBoostModal: React.FC<VinPointBoostModalProps> = ({
  listing,
  onClose,
  onSuccess,
  currentUserEmail,
}) => {
  const effectivePunti = Math.max(0, Math.round(Number(listing?.punti ?? 0)));
  const hasMaxVin = effectivePunti >= MAX_PARTNER_POINT_VALUE;
  const [vinvinStep, setVinvinStep] = useState<"info" | "amount" | "payment">("info");
  const [vinvinScoreTarget, setVinvinScoreTarget] = useState(() => Math.max(1, effectivePunti || 1));
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [vinvinError, setVinvinError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [vinvinSuccess, setVinvinSuccess] = useState(false);
  const [vinvinCountdown, setVinvinCountdown] = useState(20);
  const paymentSubmitRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    setVinvinScoreTarget(Math.max(1, effectivePunti || 1));
  }, [effectivePunti]);

  useEffect(() => {
    if (!vinvinSuccess) return;

    const timer = setInterval(() => {
      setVinvinCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [vinvinSuccess]);

  useEffect(() => {
    if (!vinvinSuccess) return;
    if (vinvinCountdown <= 0) {
      onClose();
      onSuccess?.();
    }
  }, [vinvinCountdown, onClose, onSuccess, vinvinSuccess]);

  const vinvinPurchaseAmount = Math.max(0, vinvinScoreTarget - effectivePunti);

  const formattedVinvinAmount = useMemo(
    () =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(vinvinPurchaseAmount),
    [vinvinPurchaseAmount],
  );

  const vinvinRelevance = Math.min(
    100,
    Math.round((vinvinScoreTarget / MAX_PARTNER_POINT_VALUE) * 100),
  );

  const registerPaymentSubmit = useCallback((handler: () => Promise<void>) => {
    paymentSubmitRef.current = handler;
  }, []);

  const handlePaymentError = useCallback((message: string) => {
    setVinvinError(message);
    setIsProcessingPayment(false);
  }, []);

  const handlePaymentSuccess = useCallback(async () => {
    if (!listing) return;

    try {
      await axios.post("/api/listings/punti", {
        listingId: listing.id,
        punti: vinvinScoreTarget,
      });
      setVinvinError(null);
      setVinvinSuccess(true);
      setVinvinCountdown(20);
    } catch (error) {
      console.error("Failed to update vin point after payment", error);
      setVinvinError("Payment succeeded but updating your VIN POINT failed. Please refresh and try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  }, [listing, vinvinScoreTarget]);

  const handleVinvinAction = useCallback(async () => {
    if (vinvinStep === "info") {
      setVinvinError(null);
      setVinvinStep("amount");
      return;
    }

        if (vinvinStep === "amount") {
      // MAX VIN case → button is "Continue" and just closes the modal
      if (hasMaxVin) {
        setVinvinError(null);
        onClose();
        onSuccess?.();
        return;
      }

      // normal case → proceed to payment
      if (vinvinPurchaseAmount <= 0) {
        setVinvinError("Increase your VIN POINT to proceed with payment.");
        return;
      }

      try {
        setIsProcessingPayment(true);
        const response = await axios.post("/api/create-payment-intent", {
          amount: vinvinPurchaseAmount * 100,
          email: currentUserEmail,
        });

        setClientSecret(response.data.clientSecret);
        setVinvinStep("payment");
        setVinvinError(null);
        setIsProcessingPayment(false);
      } catch (error) {
        console.error("Failed to start VinVin payment", error);
        setVinvinError("Unable to start payment. Please check your connection and try again.");
        setIsProcessingPayment(false);
      }
      return;
    }

    if (vinvinStep === "payment") {
      if (paymentSubmitRef.current) {
        setVinvinError(null);
        setIsProcessingPayment(true);
        await paymentSubmitRef.current();
      } else {
        setVinvinError("Payment form is not ready yet. Please wait a moment.");
      }
    }
  }, [vinvinStep, vinvinPurchaseAmount, currentUserEmail, effectivePunti]);

  if (!listing) return null;

  const vinvinModalBody = (
    <AnimatePresence mode="wait" initial={false}>
      {vinvinStep === "info" && (
        <motion.div
          key="vinvin-info"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            <button
              type="button"
              onClick={() => setVinvinStep("info")}
              className="rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-semibold text-white"
            >
              1 · OVERVIEW
            </button>
            <button
              type="button"
              onClick={() => setVinvinStep("amount")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              2 · CHOOSE AMOUNT
            </button>
            <button
              type="button"
              onClick={() => clientSecret && setVinvinStep("payment")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-400 hover:bg-neutral-200 transition disabled:opacity-50"
              disabled={!clientSecret}
            >
              3 · CHECKOUT
            </button>
          </div>

          <div className="rounded-3xl bg-transparent p-6 shadow-lg">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-md">
                <SiJsonwebtokens size={30} />
              </div>

              <h3 className="text-base font-semibold tracking-tight text-neutral-900">
                What is the vin point?
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
                VIN POINT determines how prominently your listing appears. Increase it to boost visibility.
              </p>

              <div className="grid gap-3 text-left text-sm text-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold uppercase tracking-wide text-white">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">Increase VIN POINT</p>
                    <p className="text-neutral-600">Set a higher VIN POINT to climb the ranking.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold uppercase tracking-wide text-neutral-900">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">Checkout securely</p>
                    <p className="text-neutral-600">Complete a quick payment for the additional points.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold uppercase tracking-wide text-neutral-900">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">Watch your listing rise</p>
                    <p className="text-neutral-600">We’ll apply the VIN POINT increase automatically.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

    {vinvinStep === "amount" && (
        <motion.div
          key="vinvin-amount"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            <button
              type="button"
              onClick={() => setVinvinStep("info")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              1 · OVERVIEW
            </button>
            <button
              type="button"
              onClick={() => setVinvinStep("amount")}
              className="rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-semibold text-white"
            >
              2 · CHOOSE AMOUNT
            </button>
            <button
              type="button"
              onClick={() => clientSecret && setVinvinStep("payment")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-400 hover:bg-neutral-200 transition disabled:opacity-50"
              disabled={!clientSecret}
            >
              3 · CHECKOUT
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Boost listing <span className="font-semibold text-neutral-900">{listing.title}</span> by choosing your desired VIN POINT.
            </p>

            <div className="grid gap-4 rounded-3xl border border-neutral-200 bg-neutral-50/60 p-4">
              {hasMaxVin ? (
                <>
                  {/* top row: energy info + relevance only */}
                  <div className="flex justify-center text-sm text-neutral-700">
                    <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700 shadow-sm">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <HiBolt size={16} />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                        Max VIN reached! Enjoy the rest.
                        </span>
                    </div>
                  </div>

                  {/* big relevance circle */}
                  <div className="flex justify-center py-4">
                    <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg">
                      <span className="text-3xl font-bold">100%</span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
                        Relevance
                      </span>
                    </div>
                  </div>

                  {/* result card only */}
                  <div className="rounded-2xl bg-white p-3 text-sm text-neutral-700 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        {effectivePunti}
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Result</p>
                            <p className="font-semibold text-neutral-900">
                                You&rsquo;ve unlocked the Relevant volume: your services are now among the top-rated in your area.
                            </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* normal state: current / target / relevance */}
                  <div className="flex items-center justify-between text-sm text-neutral-700">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Current VIN POINT</p>
                      <p className="text-xl font-semibold text-neutral-900">{effectivePunti}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Target VIN POINT</p>
                      <p className="text-xl font-semibold text-neutral-900">{vinvinScoreTarget}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Relevance</p>
                      <p className="text-xl font-semibold text-neutral-900">{vinvinRelevance}%</p>
                    </div>
                  </div>

                  {/* controls: counter + slider */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Choose VIN POINT
                    </label>
                    <Counter
                      title=""
                      subtitle=""
                      value={vinvinScoreTarget}
                      onChange={(value) =>
                        setVinvinScoreTarget(
                          Math.min(
                            MAX_PARTNER_POINT_VALUE,
                            Math.max(effectivePunti || 1, value),
                          ),
                        )
                      }
                    />
                    <input
                      type="range"
                      min={effectivePunti || 1}
                      max={MAX_PARTNER_POINT_VALUE}
                      value={vinvinScoreTarget}
                      onChange={(event) =>
                        setVinvinScoreTarget(
                          Math.min(
                            MAX_PARTNER_POINT_VALUE,
                            Math.max(effectivePunti || 1, Number(event.target.value)),
                          ),
                        )
                      }
                      className="w-full accent-neutral-900"
                    />
                    <p className="text-xs text-neutral-500">Up to {MAX_PARTNER_POINT_VALUE} VIN POINT.</p>
                  </div>

                  {/* bottom cards: current / increase / result */}
                  <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-3 text-sm text-neutral-700 shadow-sm md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
                        {effectivePunti}
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Current</p>
                        <p className="font-semibold text-neutral-900">VIN POINT</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
                        +{vinvinPurchaseAmount}
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Increase</p>
                        <p className="font-semibold text-neutral-900">Additional points</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        {vinvinScoreTarget}
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Result</p>
                        <p className="font-semibold text-neutral-900">
                          {vinvinScoreTarget === MAX_PARTNER_POINT_VALUE
                            ? "You’ve unlocked the RELEVANT level – your services are now among the top-rated in your area."
                            : "New VIN POINT"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {vinvinStep === "payment" && (
        <motion.div
          key="vinvin-payment"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            <button
              type="button"
              onClick={() => setVinvinStep("info")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              1 · OVERVIEW
            </button>
            <button
              type="button"
              onClick={() => setVinvinStep("amount")}
              className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-200 transition"
            >
              2 · CHOOSE AMOUNT
            </button>
            <button
              type="button"
              onClick={() => clientSecret && setVinvinStep("payment")}
              className="rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-semibold text-white"
              disabled={!clientSecret}
            >
              3 · CHECKOUT
            </button>
          </div>

          <div className="grid gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
            {vinvinSuccess ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <HiCheckCircle size={30} />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Payment successful</h3>
                <p className="text-sm text-neutral-600">
                  We updated VIN POINT for <span className="font-semibold">{listing.title}</span>. Redirecting…
                </p>
                <PaymentConfetti />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-700">
                  <RiSecurePaymentLine className="h-5 w-5 text-neutral-900" />
                  <div>
                    <p className="font-semibold text-neutral-900">Secure payment</p>
                    <p className="text-neutral-600">Complete your purchase to boost VIN POINT.</p>
                  </div>
                </div>

                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <VinvinPaymentForm
                      clientSecret={clientSecret}
                      amountLabel={`${formattedVinvinAmount} to increase VIN POINT by ${vinvinPurchaseAmount}`}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      registerSubmit={registerPaymentSubmit}
                    />
                  </Elements>
                )}

                {vinvinError && (
                  <p className="text-sm text-red-600">{vinvinError}</p>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

    const vinvinActionLabel = vinvinSuccess
    ? `Redirecting in ${vinvinCountdown}s`
    : isProcessingPayment
      ? "Processing…"
      : vinvinStep === "info"
        ? "Boost listing ->"
        : vinvinStep === "amount"
          ? hasMaxVin
            ? "Continue"
            : "Proceed"
          : `Pay ${formattedVinvinAmount}`;

  return (
    <Modal
      isOpen={Boolean(listing)}
      onClose={onClose}
      onSubmit={handleVinvinAction}
      closeOnSubmit={false}
      actionLoading={isProcessingPayment}
      title={vinvinStep === "amount" ? "Boost your vin point" : "Vin Point Manager "}
      actionLabel={vinvinActionLabel}
      body={vinvinModalBody}
      footer={undefined}
      disabled={isProcessingPayment || vinvinSuccess}
      className=""
      submitOnEnter={false}
    />
  );
};

export default VinPointBoostModal;
