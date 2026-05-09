// Phase 5 D-14 (INTEG-06): mock-mode header stub.
//
// Shared-mode (VITE_AUTH_MODE === 'shared') → returns null:
//   предполагается, что Misha-shell обёртывает web-map в свой header.
// Mock-mode → renders простой header с brand-green фоном + user display_name.
//
// Note: компонент НЕ mounted by default в DesktopLayout/MobileLayout в Phase 5.
// Existence component'а satisfies INTEG-06 readiness; фактический mount —
// post-Misha-coordination integration ticket.
import { env } from '@/shared/config';
import { useAuth } from '@/shared/auth';

export function StubHeader() {
  // useAuth ВСЕГДА вызывается (rules-of-hooks); guard на VITE_AUTH_MODE
  // переключается между full render и null. env.VITE_AUTH_MODE module-locked
  // на старте → branch стабилен между render'ами.
  const { user } = useAuth();

  if (env.VITE_AUTH_MODE === 'shared') return null;

  return (
    <header
      role="banner"
      className="flex items-center justify-between bg-brand-green-500 px-4 py-2 text-sm text-white"
    >
      <span className="font-semibold">ParkTrack — Карта парковок</span>
      {user && <span className="opacity-80">{user.display_name}</span>}
    </header>
  );
}
