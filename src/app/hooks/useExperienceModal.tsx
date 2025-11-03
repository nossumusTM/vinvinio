import { create } from 'zustand';

import type { SafeListing } from '@/app/types';

interface TourModalStore {
  isOpen: boolean;
  editingListing: SafeListing | null;
  onOpen: () => void;
  openForEditing: (listing: SafeListing) => void;
  onClose: () => void;
}

const useTourModal = create<TourModalStore>((set) => ({
  isOpen: false,
  editingListing: null,
  onOpen: () => set({ isOpen: true, editingListing: null }),
  openForEditing: (listing) => set({ isOpen: true, editingListing: listing }),
  onClose: () => set({ isOpen: false, editingListing: null }),
}));

export default useTourModal;
