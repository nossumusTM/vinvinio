// 'use client';

// import { useEffect, useRef, useState } from 'react';
// import { useSearchParams, useRouter } from 'next/navigation';
// import axios from 'axios';

// import Button from '@/app/(marketplace)/components/Button';
// import Heading from '@/app/(marketplace)/components/Heading';

// const SubscriptionSuccessPage = () => {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const listingId = searchParams?.get('listingId');

//   const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
//   const [message, setMessage] = useState<string>('Preparing your VIN subscription...');
//   const [vinCardId, setVinCardId] = useState<string | null>(null);
//   const hasRequested = useRef(false);

//   useEffect(() => {
//     if (hasRequested.current) return;
//     hasRequested.current = true;

//     if (!listingId) {
//       setStatus('error');
//       setMessage('Missing listing reference for this subscription.');
//       return;
//     }

//     axios
//       .post('/api/subscriptions', { listingId })
//       .then((res) => {
//         setStatus('success');
//         setMessage('Subscription activated! Your VIN card is ready.');
//         setVinCardId(res.data?.vinCardId ?? null);
//       })
//       .catch((error) => {
//         const apiMessage = error?.response?.data?.message || error?.response?.data;
//         setStatus('error');
//         setMessage(
//           typeof apiMessage === 'string'
//             ? apiMessage
//             : 'Unable to confirm your subscription. Please contact support.'
//         );
//       });
//   }, [listingId]);

//   return (
//     <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-md">
//       <Heading title="VIN subscription" subtitle={message} />

//       {status === 'success' && vinCardId && (
//         <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
//           VIN card ID: <span className="font-semibold text-emerald-900">{vinCardId}</span>
//         </div>
//       )}

//       {status === 'error' && (
//         <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
//           {message}
//         </div>
//       )}

//       <div className="flex flex-col gap-3 sm:flex-row">
//         <Button label="Go to profile" onClick={() => router.push('/profile')} />
//         {listingId && (
//           <Button label="Back to listing" onClick={() => router.push(`/listings/${listingId}`)} />
//         )}
//       </div>
//     </div>
//   );
// };

// export default SubscriptionSuccessPage;

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

import Heading from '@/app/(marketplace)/components/Heading';
import Button from '@/app/(marketplace)/components/Button';

const SubscriptionSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const confirmSubscription = async () => {
      try {
        const res = await fetch('/api/subscriptions/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || 'Failed to confirm subscription');
        }

        setStatus('success');
        toast.success('Subscription activated!');
      } catch (error) {
        console.error('Subscription confirmation failed', error);
        setStatus('error');
      }
    };

    void confirmSubscription();
  }, [sessionId]);

  return (
    <div className="pageadjust mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Heading
        title={
          status === 'success'
            ? 'Subscription confirmed'
            : status === 'error'
              ? 'We could not confirm your subscription'
              : 'Confirming your subscription'
        }
        subtitle={
          status === 'success'
            ? 'You can manage your VIN subscription from your profile at any time.'
            : status === 'error'
              ? 'Please reach out to support or try again from the listing page.'
              : 'Hold tight while we finalize your VIN subscription.'
        }
      />
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          label="Go to profile"
          onClick={() => router.push('/profile')}
        />
        <Button
          label="Back to listings"
          outline
          onClick={() => router.push('/')}
        />
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;