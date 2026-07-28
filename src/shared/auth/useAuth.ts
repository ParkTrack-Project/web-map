// Точка переключения адаптеров: mock в DEV/preview, shared — после интеграции с Мишей.
import { env } from '@/shared/config';
import mockAdapter from './mock-adapter';
import sharedAdapter from './shared-adapter';

const adapter = env.VITE_AUTH_MODE === 'shared' ? sharedAdapter : mockAdapter;

export const useAuth = () => adapter.useAuth();
