'use client';

import { createWithEqualityFn } from 'zustand/traditional';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { GeoLocaleSuggestion } from '@/app/(marketplace)/utils/geoLocale';

type GeoLocationDetection = GeoLocaleSuggestion;

type GeoLocationExperimentState = {
  detection?: GeoLocationDetection;
  isOpen: boolean;
  hasPrompted: boolean;
  accepted: boolean;
  dismissed: boolean;
  applied: boolean;
  setDetection: (data: GeoLocationDetection | undefined) => void;
  openModal: () => void;
  closeModal: () => void;
  accept: () => void;
  decline: () => void;
  markApplied: () => void;
  reset: () => void;
};

const createSafeStorage = () => {
  const memory = new Map<string, string>();

  const memoryStorage: Storage = {
    get length() {
      return memory.size;
    },
    clear: () => {
      memory.clear();
    },
    getItem: (key: string) => memory.get(key) ?? null,
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    removeItem: (key: string) => {
      memory.delete(key);
    },
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };

  return createJSONStorage<GeoLocationExperimentState>(() => {
    if (typeof window === 'undefined') {
      return memoryStorage;
    }

    try {
      return window.localStorage;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Geo location experiment persistence disabled', error);
      }
      return memoryStorage;
    }
  });
};

const useGeoLocationExperiment = createWithEqualityFn<GeoLocationExperimentState>()(
  persist(
    (set) => ({
      detection: undefined,
      isOpen: false,
      hasPrompted: false,
      accepted: false,
      dismissed: false,
      applied: false,
      setDetection: (data) => set({ detection: data }),
      openModal: () =>
        set({
          isOpen: true,
          hasPrompted: true,
        }),
      closeModal: () => set({ isOpen: false }),
      accept: () =>
        set((state) => ({
          accepted: true,
          dismissed: false,
          isOpen: false,
          hasPrompted: true,
          applied: state.applied,
        })),
      decline: () =>
        set({
          accepted: false,
          dismissed: true,
          isOpen: false,
          hasPrompted: true,
        }),
      markApplied: () => set({ applied: true }),
      reset: () =>
        set({
          detection: undefined,
          isOpen: false,
          hasPrompted: false,
          accepted: false,
          dismissed: false,
          applied: false,
        }),
    }),
    {
      name: 'geo-location-experiment',
      storage: createSafeStorage(),
      partialize: (state) => ({
        detection: state.detection,
        hasPrompted: state.hasPrompted,
        accepted: state.accepted,
        dismissed: state.dismissed,
      }),
    },
  ),
);

export type { GeoLocationDetection };
export default useGeoLocationExperiment;
