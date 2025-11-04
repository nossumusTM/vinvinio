import { create } from "zustand";

interface ForgetPasswordModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  step: number;
  setStep: (step: number) => void;
}

const useForgetPasswordModal = create<ForgetPasswordModalStore>((set) => ({
  isOpen: false,
  step: 1,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false, step: 1 }), // reset on close
  setStep: (step) => set({ step }),
}));

export default useForgetPasswordModal;