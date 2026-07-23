import { create } from 'zustand';

interface WtpPromptState {
  /** Открыто ли pre-flight окно «Где припарковаться?». */
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useWtpPrompt = create<WtpPromptState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
