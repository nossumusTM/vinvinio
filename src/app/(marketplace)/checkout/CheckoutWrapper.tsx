// 'use client';

// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
// import CheckoutContent from './CheckoutContent';
// import { useEffect, useState } from 'react';
// import axios from 'axios';

// // Make sure this is your public key
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// const CheckoutWrapper = () => {
//   const [clientSecret, setClientSecret] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchClientSecret = async () => {
//       try {
//         const res = await axios.post('/api/create-payment-intent', {
//           amount: 2000, // Replace with actual total * 100
//         });

//         setClientSecret(res.data.clientSecret);
//       } catch (error) {
//         console.error('Error fetching client secret:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchClientSecret();
//   }, []);

//   if (loading || !clientSecret) return <div>Loading payment...</div>;

//   return (
//     <Elements stripe={stripePromise} options={{ clientSecret }}>
//       <CheckoutContent clientSecret={clientSecret} />
//     </Elements>
//   );
// };

// export default CheckoutWrapper;

// CheckoutWrapper.tsx
// 'use client';

// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
// import CheckoutContent from './CheckoutContent';
// import { useEffect, useState } from 'react';
// import axios from 'axios';

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// const CheckoutWrapper = () => {
//   const [clientSecret, setClientSecret] = useState<string | null>(null);
//   const [amount, setAmount] = useState<number | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchClientSecret = async () => {
//       if (amount === null) return;

//       setLoading(true);
//       try {
//         const res = await axios.post('/api/create-payment-intent', { amount });
//         setClientSecret(res.data.clientSecret);
//       } catch (error) {
//         console.error('Error fetching client secret:', error);
//         setClientSecret(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchClientSecret();
//   }, [amount]);

//   if (loading) return <div>Loading payment...</div>;

//   return (
//     <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
//       {/* Pass setAmount to CheckoutContent so it can update the amount */}
//       <CheckoutContent clientSecret={clientSecret} setAmount={setAmount} />
//     </Elements>
//   );
// };

// export default CheckoutWrapper;

'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutContent from './CheckoutContent';
import { useEffect, useState } from 'react';
import axios from 'axios';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CheckoutWrapper = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClientSecret = async () => {
      if (amount == null) return;

      setLoading(true);
      try {
        const res = await axios.post('/api/create-payment-intent', { amount });
        setClientSecret(res.data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setClientSecret(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClientSecret();
  }, [amount]);

  if (!clientSecret) {
    // Wait until we have a valid clientSecret before rendering <Elements />
    return <CheckoutContent clientSecret={null} setAmount={setAmount} />;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutContent clientSecret={clientSecret} setAmount={setAmount} />
    </Elements>
  );
};

export default CheckoutWrapper;