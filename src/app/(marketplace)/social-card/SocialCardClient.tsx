'use client';

import { useEffect, useMemo, useState } from 'react';
import { Switch } from '@headlessui/react';
import { SafeUser } from "@/app/(marketplace)/types";
import Avatar from "@/app/(marketplace)/components/Avatar";
import Heading from "@/app/(marketplace)/components/Heading";
import { twMerge } from 'tailwind-merge';

type VisibilityKey =
  | 'image'
  | 'name'
  | 'email'
  | 'phone'
  | 'bio'
  | 'countries'
  | 'cities'
  | 'profession'
  | 'hobbies'
  | 'contacts';

const VISIBILITY_KEYS: { key: VisibilityKey; label: string }[] = [
  { key: 'image', label: 'Profile image' },
  { key: 'name', label: 'Legal name / Username' },
  { key: 'email', label: 'Email address' },
  { key: 'phone', label: 'Phone number' },
  { key: 'bio', label: 'About me' },
  { key: 'countries', label: 'Visited countries' },
  { key: 'cities', label: 'Visited cities' },
  { key: 'profession', label: 'Profession' },
  { key: 'hobbies', label: 'Hobbies' },
  { key: 'contacts', label: 'Preferred contact methods' },
];

interface SocialCardClientProps {
  currentUser: SafeUser;
}

const SocialCardClient: React.FC<SocialCardClientProps> = ({ currentUser }) => {
  const storageKey = useMemo(() => `social-card-visibility-${currentUser.id}`, [currentUser.id]);

  const [visibility, setVisibility] = useState<Record<VisibilityKey, boolean>>({
    image: true,
    name: true,
    email: true,
    phone: true,
    bio: true,
    countries: true,
    cities: true,
    profession: true,
    hobbies: true,
    contacts: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cached = window.localStorage.getItem(storageKey);
    if (!cached) return;

    try {
      const parsed = JSON.parse(cached) as Partial<Record<VisibilityKey, boolean>>;
      setVisibility((prev) => ({ ...prev, ...parsed }));
    } catch (error) {
      console.error('Failed to parse social card visibility', error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(visibility));
  }, [storageKey, visibility]);

  const legalName = currentUser.legalName || currentUser.name || 'Anonymous traveller';
  const email = currentUser.email || 'Not provided';
  const phone = currentUser.phone || 'Not provided';
  const bio = currentUser.bio || 'Tell people a little bit about who you are and why you love travelling.';
  const countries = currentUser.visitedCountries?.length ? currentUser.visitedCountries : ['Share the places you loved'];
  const cities = currentUser.visitedCities?.length ? currentUser.visitedCities : ['Add cities you have explored'];
  const profession = currentUser.profession || 'Let others know what you do';
  const hobbies = currentUser.hobbies?.length ? currentUser.hobbies : ['Add your favourite hobbies'];

  const preferredContacts = useMemo(() => {
    if (currentUser.preferredContacts?.length) {
      return currentUser.preferredContacts;
    }

    if (currentUser.contact) {
      return currentUser.contact
        .split(/\n|,|;/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }

    return ['Add the best ways to reach you'];
  }, [currentUser.contact, currentUser.preferredContacts]);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
        <div>
          <Heading title="My Social Card" subtitle="Curate what other travellers can see about you." />

          <div className="mt-6 bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-white/40">
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 opacity-90" />
              <div className="relative p-8 flex flex-col gap-6 text-white">
                {(visibility.image || visibility.name || visibility.profession) && (
                  <div className="flex items-center gap-4">
                    {visibility.image && (
                      <div className="relative">
                        <Avatar src={currentUser.image} name={legalName} size={80} />
                      </div>
                    )}
                    <div>
                      {visibility.name && (
                        <p className="text-2xl font-semibold tracking-tight">{legalName}</p>
                      )}
                      {visibility.profession && (
                        <p className="text-sm text-white/80">{profession}</p>
                      )}
                    </div>
                  </div>
                )}

                {visibility.bio && (
                  <p className="text-base leading-relaxed whitespace-pre-line">{bio}</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {visibility.email && (
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-widest text-white/60">Email</p>
                      <p className="font-medium break-words">{email}</p>
                    </div>
                  )}
                  {visibility.phone && (
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-widest text-white/60">Phone</p>
                      <p className="font-medium break-words">{phone}</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {visibility.countries && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/60">Visited countries</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {countries.map((country) => (
                          <span
                            key={country}
                            className="px-3 py-1 rounded-full bg-white/15 text-sm font-medium"
                          >
                            {country}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {visibility.cities && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/60">Visited cities</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {cities.map((city) => (
                          <span
                            key={city}
                            className="px-3 py-1 rounded-full bg-white/15 text-sm font-medium"
                          >
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {visibility.hobbies && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/60">Hobbies</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {hobbies.map((hobby) => (
                        <span
                          key={hobby}
                          className="px-3 py-1 rounded-full bg-white/15 text-sm font-medium"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {visibility.contacts && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/60">Preferred contact methods</p>
                    <div className="mt-3 space-y-2">
                      {preferredContacts.map((method) => (
                        <div
                          key={method}
                          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium"
                        >
                          {method}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-neutral-200 bg-white shadow-lg p-6 space-y-6">
          <div>
            <Heading title="Visibility settings" subtitle="Decide what your social card reveals." />
          </div>

          <div className="space-y-4">
            {VISIBILITY_KEYS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-neutral-700">{label}</span>
                <Switch
                  checked={visibility[key]}
                  onChange={(value: boolean) =>
                    setVisibility((prev) => ({
                      ...prev,
                      [key]: value,
                    }))
                  }
                  className={twMerge(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    visibility[key] ? 'bg-neutral-900 focus-visible:ring-neutral-500' : 'bg-neutral-200 focus-visible:ring-neutral-400'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={twMerge(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      visibility[key] ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </Switch>
              </div>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-neutral-500">
            These settings are stored locally on your device. We will introduce server-side preferences alongside the upcoming
            social identity features.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default SocialCardClient;

