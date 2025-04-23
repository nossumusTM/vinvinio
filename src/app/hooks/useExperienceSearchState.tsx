import { create } from 'zustand';
import { CountrySelectValue } from '@/app/components/inputs/CountrySelect';

interface ExperienceSearchState {
  location?: CountrySelectValue;
  setLocation: (value: CountrySelectValue) => void;
}

const useExperienceSearchState = create<ExperienceSearchState>((set) => ({
  location: undefined,
  setLocation: (value) => set({ location: value }),
}));

export default useExperienceSearchState;
