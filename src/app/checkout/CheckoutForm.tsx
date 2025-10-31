'use client';

import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const { data } = await axios.post('/api/create-payment-intent', {
        amount: 5000, // in cents (base $50)
      });

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name: 'John Doe' },
        },
      });

      if (result.error) {
        alert(result.error.message);
      } else if (result.paymentIntent?.status === 'succeeded') {
        alert('Payment successful!');
      }

    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!hasMounted) return null; // Prevents mismatched SSR vs client render

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing…' : 'Confirm and Pay'}
      </button>
    </form>
  );
}
