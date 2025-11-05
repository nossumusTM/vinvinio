import { create } from 'zustand';
import type { CountrySelectValue } from '@/app/components/inputs/CountrySearchSelect';

interface ExperienceSearchState {
  location?: CountrySelectValue;
  setLocation: (value: CountrySelectValue | undefined) => void;
}

const useExperienceSearchState = create<ExperienceSearchState>((set) => ({
  location: undefined,
  setLocation: (value) => set({ location: value }),
}));

export default useExperienceSearchState;
