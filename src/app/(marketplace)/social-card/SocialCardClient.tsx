'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Switch } from '@headlessui/react';
import Image from 'next/image';
import axios from 'axios';
import toast from 'react-hot-toast';

import type {
  SafeUser,
  SocialCardVisitedPlace,
  SocialCardVisibility,
} from '@/app/(marketplace)/types';
import Avatar from '@/app/(marketplace)/components/Avatar';
import Heading from '@/app/(marketplace)/components/Heading';
import CountrySearchSelect, {
  type CountrySelectValue,
} from '@/app/(marketplace)/components/inputs/CountrySearchSelect';
import { twMerge } from 'tailwind-merge';

import { LuPlus, LuTrash2 } from 'react-icons/lu';
import VerificationBadge from '@/app/(marketplace)/components/VerificationBadge';

const FRIENDLY_CONTACT_MESSAGE =
  'Need to make changes to your email, phone, or contact preferences? Head to your Account page.';

const HOBBY_PROMPT = 'Share the hobbies that make you light up when you travel.';

const JOURNEY_PROMPT = 'Tell people a little bit about your professional journey and what inspires your travels.';

const PROFESSION_PROMPT = 'Let others know what you do and how you bring experiences to life.';

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

type EditableField = 'profession' | 'journey';

type CardState = {
  profession: string;
  journey: string;
  hobbies: string[];
  visitedPlaces: SocialCardVisitedPlace[];
  visibility: Record<VisibilityKey, boolean>;
  isPublic: boolean;
};

const DEFAULT_VISIBILITY: Record<VisibilityKey, boolean> = {
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

const VISIBILITY_LABELS: { key: VisibilityKey; label: string }[] = [
  { key: 'image', label: 'Profile image' },
  { key: 'name', label: 'Legal name / Username' },
  { key: 'email', label: 'Email address' },
  { key: 'phone', label: 'Phone number' },
  { key: 'bio', label: 'About my journey' },
  { key: 'countries', label: 'Destinations' },
  { key: 'cities', label: 'Cities visited' },
  { key: 'profession', label: 'What I do' },
  { key: 'hobbies', label: 'Hobbies' },
  { key: 'contacts', label: 'Preferred contact methods' },
];

const normalizeVisibility = (value?: SocialCardVisibility | null) => {
  const merged: Record<VisibilityKey, boolean> = { ...DEFAULT_VISIBILITY };

  if (!value || typeof value !== 'object') {
    return merged;
  }

  (Object.keys(merged) as VisibilityKey[]).forEach((key) => {
    const next = (value as Record<string, unknown>)[key];
    if (typeof next === 'boolean') {
      merged[key] = next;
    }
  });

  return merged;
};

const mapVisitedPlaces = (input: unknown): SocialCardVisitedPlace[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  const places: SocialCardVisitedPlace[] = [];

  input.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const record = entry as Record<string, unknown>;
    const countryCode = record.countryCode;
    const countryName = record.countryName;
    const city = record.city;

    if (typeof countryCode !== 'string' || typeof countryName !== 'string') {
      return;
    }

    places.push({
      countryCode: countryCode.trim().toUpperCase(),
      countryName: countryName.trim(),
      city: typeof city === 'string' ? city.trim() : null,
    });
  });

  return places;
};

const mergeCardState = (payload: any): CardState => ({
  profession: typeof payload?.profession === 'string' ? payload.profession : '',
  journey: typeof payload?.journey === 'string' ? payload.journey : '',
  hobbies: Array.isArray(payload?.hobbies)
    ? payload.hobbies.filter((entry: unknown): entry is string => typeof entry === 'string')
    : [],
  visitedPlaces: mapVisitedPlaces(payload?.visitedPlaces),
  visibility: normalizeVisibility(payload?.visibility),
  isPublic: typeof payload?.isPublic === 'boolean' ? payload.isPublic : true,
});

const deriveInitialState = (user: SafeUser): CardState => ({
  profession: user.profession ?? '',
  journey: user.bio ?? '',
  hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
  visitedPlaces: Array.isArray(user.visitedPlaces)
    ? mapVisitedPlaces(user.visitedPlaces)
    : [],
  visibility: normalizeVisibility(user.socialCardVisibility),
  isPublic: typeof user.socialCardIsPublic === 'boolean' ? user.socialCardIsPublic : true,
});

const buildVisitedPlacesPayload = (places: SocialCardVisitedPlace[]) =>
  places.map((place) => ({
    countryCode: place.countryCode,
    countryName: place.countryName,
    city: place.city ?? undefined,
  }));

interface SocialCardClientProps {
  currentUser: SafeUser;
}

const SocialCardClient: React.FC<SocialCardClientProps> = ({ currentUser }) => {
  const [card, setCard] = useState<CardState>(() => deriveInitialState(currentUser));
  const [initializing, setInitializing] = useState(true);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [fieldDraft, setFieldDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationValue, setLocationValue] = useState<CountrySelectValue | null>(null);
  const [hobbyDraft, setHobbyDraft] = useState('');

  const legalName = currentUser.legalName || currentUser.name || 'Anonymous traveller';
  const email = currentUser.email || 'Not provided';
  const phone = currentUser.phone || 'Not provided';

  const preferredContacts = useMemo(() => {
    if (Array.isArray(currentUser.preferredContacts) && currentUser.preferredContacts.length) {
      return currentUser.preferredContacts;
    }

    if (currentUser.contact) {
      return currentUser.contact
        .split(/\n|,|;/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }

    return ['Share the best ways to reach you'];
  }, [currentUser.contact, currentUser.preferredContacts]);

  const visibleCard = useMemo(() => card.visibility, [card.visibility]);

  const startEditing = useCallback(
    (field: EditableField) => {
      setEditingField(field);
      setFieldDraft(field === 'profession' ? card.profession : card.journey);
    },
    [card.journey, card.profession]
  );

  const cancelEditing = useCallback(() => {
    setEditingField(null);
    setFieldDraft('');
  }, []);

  const syncCard = useCallback(
    async (
      payload: Partial<{[
        K in keyof CardState
      ]: CardState[K] }> & {
        visibility?: Record<VisibilityKey, boolean>;
      },
      options: { successMessage?: string } = {}
    ) => {
      try {
        const res = await axios.put('/api/social-card', {
          ...payload,
          visitedPlaces: payload.visitedPlaces
            ? buildVisitedPlacesPayload(payload.visitedPlaces)
            : undefined,
          visibility: payload.visibility,
        });

        const next = mergeCardState(res.data);
        setCard(next);

        if (options.successMessage) {
          toast.success(options.successMessage);
        }
      } catch (error) {
        console.error('[SOCIAL_CARD_UPDATE]', error);
        toast.error('We could not update your social card right now. Please try again.');
        throw error;
      }
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      setInitializing(true);
      try {
        const res = await axios.get('/api/social-card');
        setCard(mergeCardState(res.data));
      } catch (error) {
        console.error('[SOCIAL_CARD_LOAD]', error);
        setCard(deriveInitialState(currentUser));
      } finally {
        setInitializing(false);
      }
    };

    load();
  }, [currentUser]);

  const handleSaveField = useCallback(async () => {
    if (!editingField) return;
    const trimmed = fieldDraft.trim();

    if ((editingField === 'profession' ? card.profession : card.journey) === trimmed) {
      cancelEditing();
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingField === 'profession') {
        await syncCard({ profession: trimmed }, { successMessage: 'Updated what you do.' });
      } else {
        await syncCard({ journey: trimmed }, { successMessage: 'Updated your journey.' });
      }
      cancelEditing();
    } finally {
      setIsSubmitting(false);
    }
  }, [cancelEditing, card.journey, card.profession, editingField, fieldDraft, syncCard]);

  const handleToggleVisibility = useCallback(
    async (key: VisibilityKey, value: boolean) => {
      const nextVisibility = { ...card.visibility, [key]: value };
      setCard((prev) => ({ ...prev, visibility: nextVisibility }));

      try {
        await syncCard({ visibility: nextVisibility });
      } catch (error) {
        setCard((prev) => ({ ...prev, visibility: { ...prev.visibility, [key]: !value } }));
      }
    },
    [card.visibility, syncCard]
  );

  const handleTogglePublic = useCallback(
    async (value: boolean) => {
      setCard((prev) => ({ ...prev, isPublic: value }));
      try {
        await syncCard({ isPublic: value }, { successMessage: value ? 'Your social card is now public.' : 'Your social card is now private.' });
      } catch (error) {
        setCard((prev) => ({ ...prev, isPublic: !value }));
      }
    },
    [syncCard]
  );

  const handleAddVisitedPlace = useCallback(async () => {
    if (!locationValue) return;

    const valueParts = locationValue.value?.split('-') ?? [];
    const countryCode = valueParts[valueParts.length - 1]?.toUpperCase() ?? '';
    const countryName = locationValue.label;
    const city = locationValue.city?.trim();

    if (!countryCode || !countryName) {
      toast.error('Please select a valid destination.');
      return;
    }

    const signature = `${countryCode}::${city ?? ''}`;
    const exists = card.visitedPlaces.some(
      (place) => `${place.countryCode}::${place.city ?? ''}` === signature
    );

    if (exists) {
      toast('This destination is already in your list.');
      setLocationValue(null);
      return;
    }

    const nextPlaces = [...card.visitedPlaces, { countryCode, countryName, city }];
    setIsSubmitting(true);
    try {
      await syncCard({ visitedPlaces: nextPlaces }, { successMessage: 'Updated your destinations.' });
      setLocationValue(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [card.visitedPlaces, locationValue, syncCard]);

  const handleRemoveVisitedPlace = useCallback(
    async (signature: string) => {
      const nextPlaces = card.visitedPlaces.filter(
        (place) => `${place.countryCode}::${place.city ?? ''}` !== signature
      );

      setIsSubmitting(true);
      try {
        await syncCard({ visitedPlaces: nextPlaces }, { successMessage: 'Updated your destinations.' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [card.visitedPlaces, syncCard]
  );

  const handleAddHobby = useCallback(async () => {
    const trimmed = hobbyDraft.trim();
    if (!trimmed) return;

    if (card.hobbies.includes(trimmed)) {
      toast('You already listed this hobby.');
      setHobbyDraft('');
      return;
    }

    const nextHobbies = [...card.hobbies, trimmed];
    setIsSubmitting(true);
    try {
      await syncCard({ hobbies: nextHobbies }, { successMessage: 'Updated your hobbies.' });
      setHobbyDraft('');
    } finally {
      setIsSubmitting(false);
    }
  }, [card.hobbies, hobbyDraft, syncCard]);

  const handleRemoveHobby = useCallback(
    async (hobby: string) => {
      const nextHobbies = card.hobbies.filter((entry) => entry !== hobby);
      setIsSubmitting(true);
      try {
        await syncCard({ hobbies: nextHobbies }, { successMessage: 'Updated your hobbies.' });
      } finally {
        setIsSubmitting(false);
      }
    },
    [card.hobbies, syncCard]
  );

  const visitedDisplay = useMemo(() => {
    if (card.visitedPlaces.length === 0) {
      return [
        {
          countryCode: 'globe',
          countryName: 'Add destinations you have explored',
          city: undefined,
        },
      ];
    }

    return card.visitedPlaces;
  }, [card.visitedPlaces]);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
        <div>
          {/* <Heading title="My Social Card" subtitle="Curate what other travellers can see about you." /> */}

          <div className="mt-0 bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-white/40">
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 backdrop-blur-md opacity-90" />
              <div className="relative p-8 flex flex-col gap-6 text-white">
                {(visibleCard.image || visibleCard.name || visibleCard.profession) && (
                  <div className="flex items-center gap-4">
                    {visibleCard.image && (
                      <div className="relative">
                        <Avatar src={currentUser.image} name={legalName} size={80} />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      {visibleCard.name && (
                        <p className="text-2xl font-semibold tracking-tight">{legalName}</p>
                      )}
                      {visibleCard.profession && (
                        editingField === 'profession' ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={fieldDraft}
                              onChange={(event) => setFieldDraft(event.target.value)}
                              rows={2}
                              className="w-full rounded-xl border border-white/30 bg-white/10 p-3 text-sm text-white placeholder-white/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60"
                              placeholder={PROFESSION_PROMPT}
                              disabled={isSubmitting}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleSaveField}
                                disabled={isSubmitting}
                                className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:shadow-lg disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                disabled={isSubmitting}
                                className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing('profession')}
                            className="text-sm text-white/80 transition hover:text-white"
                          >
                            {card.profession || PROFESSION_PROMPT}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {visibleCard.bio && (
                  editingField === 'journey' ? (
                    <div className="flex flex-col gap-3">
                      <textarea
                        value={fieldDraft}
                        onChange={(event) => setFieldDraft(event.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-white/30 bg-white/10 p-4 text-sm leading-relaxed text-white placeholder-white/60 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/60"
                        placeholder={JOURNEY_PROMPT}
                        disabled={isSubmitting}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSaveField}
                          disabled={isSubmitting}
                          className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:shadow-lg disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={isSubmitting}
                          className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditing('journey')}
                      className="text-base leading-relaxed whitespace-pre-line text-left text-white/90 transition hover:text-white"
                    >
                      {card.journey || JOURNEY_PROMPT}
                    </button>
                  )
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleCard.email && (
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-widest text-white/60">Email</p>
                      <p className="font-medium break-words">{email}</p>
                      <div className="mt-2">
                        <VerificationBadge
                          verified={Boolean(currentUser.emailVerified)}
                          pendingLabel="Pending verification"
                          size="md"
                        />
                    </div>
                    </div>
                  )}
                  {visibleCard.phone && (
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-widest text-white/60">Phone</p>
                      <p className="font-medium break-words">{phone}</p>
                      <div className="mt-2">
                        <VerificationBadge
                          verified={Boolean(currentUser.phoneVerified)}
                          pendingLabel="Pending verification"
                          size="md"
                        />
                    </div>
                    </div>
                  )}
                </div>

                {(visibleCard.countries || visibleCard.cities) && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/60">Destinations explored</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {visitedDisplay.map((place) => {
                        const code = place.countryCode?.toLowerCase();
                        const label = place.city ? `${place.city}, ${place.countryName}` : place.countryName;
                        const hasFlag = Boolean(code && code !== 'globe');

                        return (
                          <span
                            key={`${place.countryCode}::${place.city ?? 'any'}`}
                            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium"
                          >
                            <span className="relative inline-flex h-5 w-5 overflow-hidden rounded-full bg-white/30">
                              {hasFlag ? (
                                <Image
                                  src={`/images/flags/${code}.svg`}
                                  alt={place.countryName}
                                  fill
                                  sizes="20px"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white/70">
                                  🌍
                                </span>
                              )}
                            </span>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {visibleCard.hobbies && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/60">Hobbies</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(card.hobbies.length ? card.hobbies : [HOBBY_PROMPT]).map((hobby) => (
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

                {visibleCard.contacts && (
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

                <p className="text-[11px] text-white/70">{FRIENDLY_CONTACT_MESSAGE}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-1">
            <div className="rounded-3xl border border-neutral-200 bg-white shadow-lg p-6 space-y-4">
              <h3 className="text-base font-semibold text-neutral-900">Visited destinations</h3>
              <p className="text-sm text-neutral-600">
                Use the search below to add cities and countries you have explored.
              </p>
              <div className='flex flex-row gap-2'>
                <CountrySearchSelect
                  value={locationValue}
                  onChange={(value) => setLocationValue(value ?? null)}
                />
                <div className='flex flex-row gap-2'>
                  <button
                    type="button"
                    onClick={handleAddVisitedPlace}
                    disabled={isSubmitting || !locationValue || initializing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <LuPlus className="h-4 w-4" aria-hidden="true" />
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {card.visitedPlaces.length === 0 && (
                  <p className="text-sm text-neutral-500">No destinations yet. Start adding the places you love!</p>
                )}
                {card.visitedPlaces.map((place) => {
                  const signature = `${place.countryCode}::${place.city ?? ''}`;
                  const label = place.city ? `${place.city}, ${place.countryName}` : place.countryName;
                  return (
                    <div
                      key={signature}
                      className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700"
                    >
                      <span className="flex items-center gap-2">
                        <span className="relative inline-flex h-5 w-5 overflow-hidden rounded-full bg-neutral-200">
                          <Image
                            src={`/images/flags/${place.countryCode.toLowerCase()}.svg`}
                            alt={place.countryName}
                            fill
                            sizes="20px"
                            className="object-cover"
                          />
                        </span>
                        {label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVisitedPlace(signature)}
                        disabled={isSubmitting || initializing}
                        className="rounded-full p-1 text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800 disabled:opacity-50"
                        aria-label={`Remove ${label}`}
                      >
                        <LuTrash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white shadow-lg p-6 space-y-4">
              <h3 className="text-base font-semibold text-neutral-900">Your favourite hobbies</h3>
              <p className="text-sm text-neutral-600">Let the community know what energises you outside of travelling.</p>
              <div className="flex flex-row gap-2">
                <input
                  type="text"
                  value={hobbyDraft}
                  onChange={(event) => setHobbyDraft(event.target.value)}
                  placeholder="Add a hobby"
                  className="ring-0 focus-within:ring-0 rounded-2xl border-2 bg-white/90 backdrop-blur shadow-sm hover:shadow-md border-white/60 hover:border-neutral-200 flex-1 rounded-xl shadow-sm px-4 py-3 text-sm"
                  disabled={isSubmitting || initializing}
                />
                <button
                  type="button"
                  onClick={handleAddHobby}
                  disabled={isSubmitting || initializing || hobbyDraft.trim().length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LuPlus className="h-4 w-4" aria-hidden="true" />
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {card.hobbies.length === 0 && (
                  <span className="rounded-2xl bg-neutral-100 px-3 py-1 text-sm text-neutral-500">{HOBBY_PROMPT}</span>
                )}
                {card.hobbies.map((hobby) => (
                  <span
                    key={hobby}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                  >
                    {hobby}
                    <button
                      type="button"
                      onClick={() => handleRemoveHobby(hobby)}
                      disabled={isSubmitting || initializing}
                      className="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-700 disabled:opacity-50"
                      aria-label={`Remove ${hobby}`}
                    >
                      <LuTrash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-neutral-200 bg-white shadow-lg p-6 space-y-6 lg:sticky lg:top-32 lg:self-start">
          <div className="space-y-1">
            <Heading title="Visibility settings" subtitle="Decide what your social card reveals." />
            <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <span className="text-sm font-medium text-neutral-700">Make my social card public</span>
              <Switch
                checked={card.isPublic}
                onChange={handleTogglePublic}
                className={twMerge(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  card.isPublic ? 'bg-neutral-900 focus-visible:ring-neutral-500' : 'bg-neutral-200 focus-visible:ring-neutral-400'
                )}
              >
                <span
                  aria-hidden="true"
                  className={twMerge(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    card.isPublic ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </Switch>
            </div>
          </div>

          <div className="space-y-4">
            {VISIBILITY_LABELS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-neutral-700">{label}</span>
                <Switch
                  checked={visibleCard[key]}
                  onChange={(value: boolean) => handleToggleVisibility(key, value)}
                  className={twMerge(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    visibleCard[key]
                      ? 'bg-neutral-900 focus-visible:ring-neutral-500'
                      : 'bg-neutral-200 focus-visible:ring-neutral-400'
                  )}
                  disabled={initializing}
                >
                  <span
                    aria-hidden="true"
                    className={twMerge(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                      visibleCard[key] ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </Switch>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SocialCardClient;
