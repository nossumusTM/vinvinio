import { create } from 'zustand';

interface Recipient {
  id: string;
  name: string;
  image?: string;
}

interface MessengerStore {
  isOpen: boolean;
  isChatOpen: boolean;
  recipient: Recipient | null;
  unreadCount: number;
  openList: () => void;
  openChat: (recipient: Recipient) => void;
  close: () => void;
  setUnreadCount: (count: number) => void;
}

const useMessenger = create<MessengerStore>((set) => ({
  isOpen: false,
  isChatOpen: false,
  recipient: null,
  unreadCount: 0,

  openList: () => set({
    isOpen: true,
    isChatOpen: false,
    recipient: null,
  }),

  openChat: (recipient) => set({
    isOpen: true,
    isChatOpen: true,
    recipient,
  }),

  close: () => set({
    isOpen: false,
    isChatOpen: false,
    recipient: null,
  }),

  setUnreadCount: (count) => set({ unreadCount: count }),
}));

export default useMessenger;