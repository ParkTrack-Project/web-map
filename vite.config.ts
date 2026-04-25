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
      },
    },
    test: {
      environment: 'happy-dom',
      setupFiles: ['./tests/setup.ts'],
      globals: true,
      css: false,
    },
  };
});
