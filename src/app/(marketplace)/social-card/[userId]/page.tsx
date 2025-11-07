import Image from 'next/image';
import { notFound } from 'next/navigation';

import prisma from '@/app/(marketplace)/libs/prismadb';
import type {
  SocialCardVisitedPlace,
  SocialCardVisibility,
} from '@/app/(marketplace)/types';

export const dynamic = 'force-dynamic';

const DEFAULT_VISIBILITY: Record<string, boolean> = {
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
};

const normalizeVisibility = (input: unknown): Record<string, boolean> => {
  const merged = { ...DEFAULT_VISIBILITY };

  if (!input || typeof input !== 'object') {
    return merged;
  }

  Object.keys(merged).forEach((key) => {
    const value = (input as Record<string, unknown>)[key];
    if (typeof value === 'boolean') {
      merged[key] = value;
    }
  });

  return merged;
};

const mapVisitedPlaces = (value: unknown): SocialCardVisitedPlace[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const countryCode = (entry as Record<string, unknown>).countryCode;
      const countryName = (entry as Record<string, unknown>).countryName;
      const city = (entry as Record<string, unknown>).city;

      if (typeof countryCode !== 'string' || typeof countryName !== 'string') {
        return null;
      }

      return {
        countryCode: countryCode.trim().toUpperCase(),
        countryName: countryName.trim(),
        city: typeof city === 'string' ? city.trim() : undefined,
      } satisfies SocialCardVisitedPlace;
    })
    .filter((place): place is SocialCardVisitedPlace => Boolean(place?.countryCode && place?.countryName));
};

const SocialCardSharePage = async ({
  params,
}: {
  params: { userId: string };
}) => {
  const userId = params.userId;

  if (!userId || typeof userId !== 'string') {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      legalName: true,
      image: true,
      profession: true,
      bio: true,
      email: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      socialCardVisibility: true,
      socialCardIsPublic: true,
      visitedPlaces: true,
      hobbies: true,
      preferredContacts: true,
      contact: true,
      isSuspended: true,
    },
  });

  if (!user) {
    notFound();
  }

  if (!user.socialCardIsPublic) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <p className="text-2xl font-semibold text-neutral-900">This social card is private.</p>
        <p className="mt-2 text-sm text-neutral-600">
          The owner has chosen not to share their social card publicly.
        </p>
      </div>
    );
  }

  const visibility = normalizeVisibility(user.socialCardVisibility as SocialCardVisibility | null);
  const visitedPlaces = mapVisitedPlaces(user.visitedPlaces);
  const displayedName = user.legalName || user.name || 'Anonymous traveller';
  const email = user.email || 'Not provided';
  const phone = user.phone || 'Not provided';
  const emailVerified = Boolean(user.emailVerified);
  const phoneVerified = Boolean(user.phoneVerified);

  const preferredContacts = Array.isArray(user.preferredContacts) && user.preferredContacts.length
    ? user.preferredContacts
    : user.contact
    ? user.contact
        .split(/\n|,|;/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
  const contactDisplay = preferredContacts.length
    ? preferredContacts
    : ['Contact details not shared yet'];

  const hobbies = Array.isArray(user.hobbies)
    ? user.hobbies.filter((entry): entry is string => typeof entry === 'string')
    : [];

  const initials = displayedName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-neutral-200 bg-white shadow-xl">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 opacity-90" />
          <div className="relative space-y-6 p-10 text-white">
            {user.isSuspended && (
              <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                Suspended account
              </span>
            )}

            {(visibility.image || visibility.name || visibility.profession) && (
              <div className="flex items-center gap-4">
                {visibility.image && (
                  user.image ? (
                    <Image
                      src={user.image}
                      alt={displayedName}
                      width={96}
                      height={96}
                      className="h-24 w-24 rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold text-white">
                      {initials}
                    </div>
                  )
                )}
                <div className="space-y-1">
                  {visibility.name && (
                    <p className="text-3xl font-semibold tracking-tight">{displayedName}</p>
                  )}
                  {visibility.profession && user.profession && (
                    <p className="text-sm text-white/80">{user.profession}</p>
                  )}
                </div>
              </div>
            )}

            {visibility.bio && user.bio && (
              <p className="text-base leading-relaxed text-white/90 whitespace-pre-line">{user.bio}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {visibility.email && (
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-white/60">Email</p>
                  <p className="font-medium break-words">{email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${emailVerified ? 'bg-emerald-300' : 'bg-white/40'}`}
                    />
                    {emailVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
              )}

              {visibility.phone && (
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-white/60">Phone</p>
                  <p className="font-medium break-words">{phone}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${phoneVerified ? 'bg-emerald-300' : 'bg-white/40'}`}
                    />
                    {phoneVerified ? 'Verified' : 'Not verified'}
                  </span>
                </div>
              )}
            </div>

            {(visibility.countries || visibility.cities) && (
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Destinations explored</p>
                {visitedPlaces.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {visitedPlaces.map((place) => {
                      const code = place.countryCode.toLowerCase();
                      const label = place.city ? `${place.city}, ${place.countryName}` : place.countryName;
                      return (
                        <span
                          key={`${place.countryCode}::${place.city ?? ''}`}
                          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium"
                        >
                          <span className="relative inline-flex h-5 w-5 overflow-hidden rounded-full bg-white/30">
                            <Image
                              src={`/images/flags/${code}.svg`}
                              alt={place.countryName}
                              fill
                              sizes="20px"
                              className="object-cover"
                            />
                          </span>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-white/80">No destinations shared yet.</p>
                )}
              </div>
            )}

            {visibility.hobbies && hobbies.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Hobbies</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {visibility.contacts && contactDisplay.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Preferred contact methods</p>
                <div className="mt-3 space-y-2">
                  {contactDisplay.map((method) => (
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
  );
};

export default SocialCardSharePage;
