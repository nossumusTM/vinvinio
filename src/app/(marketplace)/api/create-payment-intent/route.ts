// import { NextRequest, NextResponse } from 'next/server';
// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//     apiVersion: '2025-02-24.acacia',
// });

// export async function POST(req: NextRequest) {
//   const { amount, email } = await req.json();

//   const paymentIntent = await stripe.paymentIntents.create({
//     amount,
//     currency: 'eur',
//     automatic_payment_methods: { enabled: true },
//     receipt_email: email,
//   });

//   return NextResponse.json({ clientSecret: paymentIntent.client_secret });
// }

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { amount, email } = await req.json();

    // Validate amount: must be a positive integer (in cents)
    if (
      !amount ||
      typeof amount !== 'number' ||
      !Number.isInteger(amount) ||
      amount < 100 // minimum 1 EUR (100 cents) to avoid tiny payments
    ) {
      return NextResponse.json(
        { error: 'Invalid or missing amount. Amount must be an integer >= 100.' },
        { status: 400 }
      );
    }

    // Optional: Validate email (basic)
    if (email && typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email must be a string.' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}