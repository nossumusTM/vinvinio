import { create } from 'zustand';

interface LocaleModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useLocaleModal = create<LocaleModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useLocaleModal;
