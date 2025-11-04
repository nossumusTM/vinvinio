// 'use client';

// import { useState, useEffect, useRef, useMemo } from 'react';
// import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { Elements } from '@stripe/react-stripe-js';
// import { loadStripe } from '@stripe/stripe-js';
// import CheckoutContent from './CheckoutContent';
// import { useRouter, useSearchParams } from 'next/navigation';
// import Image from 'next/image';
// import axios from 'axios';
// import { format } from 'date-fns';
// import { TbCalendarTime } from "react-icons/tb";
// import toast from 'react-hot-toast';

// import getCurrentUser from  '@/app/actions/getCurrentUser';
// import { useSession } from 'next-auth/react';

// import Button from '@/app/components/Button';
// import Heading from '@/app/components/Heading';
// import Avatar from '../components/Avatar';
// import dynamic from 'next/dynamic';

// import useLoginModal from '@/app/hooks/useLoginModal';
// import useRegisterModal from '@/app/hooks/useRegisterModal';

// const CountrySelect = dynamic(() => import('@/app/components/inputs/CountrySelect'), {
//   ssr: false,
// });
// // import CountrySelect from '@/app/components/inputs/CountrySelect';
// import { CountrySelectValue } from '@/app/components/inputs/CountrySelect';
// import ConfirmPopup from '../components/ConfirmPopup';

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// const CheckoutPage = () => {
//   return (
//     <Elements stripe={stripePromise}>
//       <CheckoutContent />
//     </Elements>
//   );
// };

'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutContent from './CheckoutContent';
import CheckoutWrapper from './CheckoutWrapper';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutWrapper />
    </Elements>
  );
}