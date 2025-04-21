import { create } from "zustand";

interface ForgetPasswordModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useForgetPasswordModal = create<ForgetPasswordModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useForgetPasswordModal;