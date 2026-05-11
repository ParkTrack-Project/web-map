/// <reference types="vitest" />
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_BASE_URL = env.VITE_API_BASE_URL || 'https://api.parktrack.live';
  // Phase 5 D-22 (NFR-05): включает rollup-plugin-visualizer treemap по флагу
  // BUILD_ANALYZE=1 (см. npm run build:analyze). Default off — не замедляет CI.
  const ANALYZE = env.BUILD_ANALYZE === '1';

  return {
    plugins: [
      tailwindcss(),
      react(),
      ...(ANALYZE
        ? [
            visualizer({
              filename: 'dist/stats.html',
              template: 'treemap',
              gzipSize: true,
              brotliSize: true,
              open: true,
            }),
          ]
        : []),
    ],
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
    build: {
      rollupOptions: {
        output: {
          // Phase 5 D-23 manualChunks (NFR-05): split vendor chunks для лучшего
          // browser caching + mobile parallel-download. Pitfall 10: react +
          // react-dom + scheduler + react-error-boundary ОБЯЗАНЫ быть в одном
          // chunk — иначе runtime TDZ-ошибка (React internals shared module).
          // ymaps3-types загружается из CDN (index.html), а не из npm — пропускаем.
          manualChunks: (id: string) => {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('@yandex/ymaps3-types')) return undefined;
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/react-error-boundary/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('nuqs') || id.includes('zustand')) return 'vendor-state';
            if (id.includes('vaul') || id.includes('@radix-ui')) return 'vendor-ui';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor-misc';
          },
        },
      },
      // sourcemap включён только под BUILD_ANALYZE — для visualizer treemap;
      // production build без sourcemap чтобы не утечь исходники.
      sourcemap: ANALYZE,
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
