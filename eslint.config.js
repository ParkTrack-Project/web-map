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
      // Phase 5 D-29 NFR-01: блокирует `any` в новом коде. Существующие any → unknown / explicit.
      '@typescript-eslint/no-explicit-any': 'error',
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
      // Phase 5 D-07 (RESP-05): block `h-screen` / `100vh` regressions.
      // research: eslint-plugin-tailwindcss НЕ поддерживает Tailwind 4 (issue #325),
      // поэтому regex-rule на string-literal'ах — единственный static guard.
      // Runtime-проверка тап-таргетов 44x44 — отдельный Playwright тест
      // (tests/e2e/tap-targets.spec.ts).
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/(?:^|\\s)(h-screen|min-h-screen|max-h-screen)(?:\\s|$)/]",
          message:
            'Phase 5 D-07: use `h-dvh` (Tailwind 4 native 100dvh) instead of `h-screen` — fixes mobile keyboard collision.',
        },
        {
          selector: "Literal[value=/100vh/]",
          message:
            'Phase 5 D-07: use `100dvh` instead of `100vh` — fixes mobile keyboard collision.',
        },
      ],
    },
  },
  // eslint-config-prettier MUST be last to disable formatting rules that conflict with Prettier.
  eslintConfigPrettier,
]);
