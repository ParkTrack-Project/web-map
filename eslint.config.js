import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '**/features/*/*'],
              message:
                'features ↔ features imports forbidden (FSD Rule 3). Move shared logic to entities or shared.',
            },
            {
              group: ['@/entities/*/*', '**/entities/*/*'],
              message:
                'entities ↔ entities imports forbidden (FSD Rule 4). Move shared logic to shared.',
            },
          ],
        },
      ],
    },
  },
  // eslint-config-prettier MUST be last to disable formatting rules that conflict with Prettier.
  eslintConfigPrettier,
]);
