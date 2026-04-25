// Browser-only barrel. Node server (для Vitest) импортируется напрямую
// в tests/setup.ts как '@/mocks/node'.
export { worker } from './browser';
