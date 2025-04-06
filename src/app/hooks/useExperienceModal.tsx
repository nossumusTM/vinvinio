import { create } from 'zustand';

interface TourModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useTourModal = create<TourModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useTourModal;
