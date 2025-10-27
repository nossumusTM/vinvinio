// components/Newsletter.tsx
'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MdMarkEmailUnread } from "react-icons/md";

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'accommodation' | 'experience'>('experience');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubscribe = async () => {
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email');
      return;
    }
  
    setLoading(true);
    try {
      const res = await fetch('/api/email/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });
  
      if (res.status === 409) {
        toast('You’re already subscribed!', {
          icon: '💌',
        });
      } else if (!res.ok) {
        throw new Error('Subscription failed');
      } else {
            toast.success('Welcome aboard! Magic is on the way ✨', {
              iconTheme: {
                   primary: '#2200ffff',
                   secondary: '#fff',
              }
                });
        setEmail('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className="w-full max-w-xl p-6 rounded-2xl bg-neutral-100 shadow-md relative">
        <MdMarkEmailUnread size={22} className="absolute top-4 right-4" />

      <h3 className="text-2xl font-bold mb-2">Catch the Breeze</h3>
      <span className="text-sm text-neutral-600 mb-4">
        Receive curated updates on unforgettable experiences - no spam, just <p className='text-5xl text-black font-semibold'>inspiration.</p>
      </span>

      {/* <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="newsletter-type"
            value="experience"
            checked={type === 'experience'}
            onChange={() => setType('experience')}
            className="accent-black"
          />
          Experience
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="newsletter-type"
            value="accommodation"
            checked={type === 'accommodation'}
            onChange={() => setType('accommodation')}
            className="accent-black"
          />
          Accommodation
        </label>
      </div> */}

      <div className="relative w-full mt-4">
        <input
          type="email"
          placeholder="Drop email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 pr-28 rounded-xl border border-gray-300 transition text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="absolute top-0 right-0 h-full px-4 hover:bg-neutral-200 text-black bg-neutral-100 rounded-r-xl border border-gray-300 transition text-sm"
        >
          {loading ? '...' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
};

export default Newsletter;