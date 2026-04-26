/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_BASE_URL = env.VITE_API_BASE_URL || 'https://api.parktrack.live';

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('proxy error', err);
            });
          },
        },
        // Phase 4 / Task 0 CORS fallback (D-01 research override): Yandex Suggest API
        // returns 403 from non-allowlisted origins (apikey-level restriction). Proxying
        // through Vite dev server bypasses browser CORS preflight; production uses
        // matching nginx location block.
        '/yandex-suggest': {
          target: 'https://suggest-maps.yandex.ru',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/yandex-suggest/, ''),
        },
        '/yandex-geocode': {
          target: 'https://geocode-maps.yandex.ru',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/yandex-geocode/, ''),
        },
      },
    },
    test: {
      environment: 'happy-dom',
      setupFiles: ['./tests/setup.ts'],
      globals: true,
      css: false,
      exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    },
  };
});
