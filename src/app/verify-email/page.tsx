'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

// bg-gradient-to-br from-blue-50 via-white to-cyan-100

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const toastShown = useRef(false); // 🛡️ Prevents multiple toasts

  useEffect(() => {
    const token = searchParams?.get('token');
    if (!token) {
      setStatus('error');
      if (!toastShown.current) {
        toast.error('Missing token');
        toastShown.current = true;
      }
      return;
    }
  
    const verify = async () => {
      try {
        const res = await axios.post('/api/users/verify-email', { token });
        if (res.status === 200) {
          setStatus('success');
          if (!toastShown.current) {
            // toast.success('Email verified!');
            toastShown.current = true;
          }
          setTimeout(() => router.push('/profile'), 3000);
        } else {
          throw new Error('Failed to verify');
        }
      } catch (err) {
        setStatus('error');
        if (!toastShown.current) {
          toast.error('Token expired or invalid');
          toastShown.current = true;
        }
      }
    };
  
    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-[40vh] md:min-h-[40vh] flex items-center justify-center px-8 mt-6">
      <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 w-full max-w-md text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
            <h2 className="text-xl font-semibold text-neutral-700">Verifying your email...</h2>
            <p className="text-sm text-neutral-500">Hang tight, we’re checking your token.</p>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 flex items-center justify-center rounded-full shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-700">Email Verified!</h2>
            <p className="text-sm text-neutral-500">You’ll be redirected to your profile shortly.</p>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 flex items-center justify-center rounded-full shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-700">Verification Failed</h2>
            <p className="text-sm text-neutral-500">Please try again or contact our support team.</p>
          </div>
        )}
      </div>
    </div>
  );
}
