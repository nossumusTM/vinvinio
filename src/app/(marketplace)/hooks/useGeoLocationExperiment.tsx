import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const useGeoLocationExperiment = create<GeoLocationExperimentState>()(
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
