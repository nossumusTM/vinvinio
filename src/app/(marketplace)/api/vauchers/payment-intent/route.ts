import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const normalizeCurrency = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, email } = await req.json();
    const normalizedCurrency = normalizeCurrency(currency);

    if (
      !amount ||
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount < 100
    ) {
      return NextResponse.json(
        { error: "Invalid or missing amount. Amount must be an integer >= 100." },
        { status: 400 }
      );
    }

    if (!normalizedCurrency) {
      return NextResponse.json(
        { error: "Currency is required." },
        { status: 400 }
      );
    }

    if (email && typeof email !== "string") {
      return NextResponse.json(
        { error: "Email must be a string." },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: normalizedCurrency,
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      metadata: {
        flow: "vin-voucher",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}