'use client';

import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineItems: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Your Product',
              },
              unit_amount: 2000, // $20.00
            },
            quantity: 1,
          },
        ],
      }),
    });

    const { sessionId } = await res.json();
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Loading...' : 'Buy Now'}
    </button>
  );
}