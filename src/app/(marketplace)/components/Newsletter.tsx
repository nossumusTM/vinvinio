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
    <div className="w-full max-w-3xl rounded-2xl border border-neutral-100 bg-neutral-50/80 p-5 shadow-inner">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-white p-3 text-neutral-700 shadow-sm">
          <MdMarkEmailUnread size={20} />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Weekly dispatch</p>
          <h3 className="text-xl font-semibold text-neutral-900">Inbox-first travel intel</h3>
          <p className="text-sm text-neutral-600">
            Get early access to drops, spotlighted hosts, and member-only perks. No spam. Just the good stuff.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-neutral-700">
        <button
          type="button"
          onClick={() => setType('experience')}
          className={`rounded-full border px-3 py-1 transition ${
            type === 'experience'
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}
        >
          Experiences
        </button>
        <button
          type="button"
          onClick={() => setType('accommodation')}
          className={`rounded-full border px-3 py-1 transition ${
            type === 'accommodation'
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}
        >
          Stays
        </button>
      </div>
      <div className="relative mt-4 w-full rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl px-4 py-3 pr-24 text-sm text-neutral-900 outline-none transition focus:ring-1 focus:ring-neutral-900"
        />
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-neutral-900 bg-neutral-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Working...' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
};

export default Newsletter;