import { create } from 'zustand';

interface PromoteModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const usePromoteModal = create<PromoteModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default usePromoteModal;