// Quick-fix 2026-05-16: общий стейт открытия pre-flight окна «Где припарковаться?».
// Раньше open хранился локально в WTPCTAButton/WTPMobileFAB. Теперь его умеет
// открыть и SearchBar — после выбора адреса сразу предлагаем указать стартовую
// точку, чтобы найти парковки рядом с этим адресом.
//
// Почему zustand, а не Context: WTPCTAButton.test.tsx рендерит кнопку БЕЗ
// провайдера. Module-singleton стор работает без обёртки → существующие тесты
// остаются зелёными без правок.
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
