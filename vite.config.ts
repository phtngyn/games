import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { PluginOption } from '@voidzero-dev/vite-plus-core'
import { defineConfig, lazyPlugins } from 'vite-plus'

function appPlugins(): PluginOption[] {
  // Vite 8 plugins and Vite+ plugins are runtime-compatible but published from separate type roots.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return [...react(), ...tailwindcss()] as unknown as PluginOption[]
}

export default defineConfig({
  plugins: lazyPlugins(appPlugins),
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  check: {
    fmt: true,
    lint: true,
  },
  fmt: {
    ignorePatterns: ['coverage/**', 'dist/**'],
    printWidth: 100,
    semi: false,
    singleQuote: true,
    sortImports: true,
    sortPackageJson: true,
    sortTailwindcss: {
      stylesheet: './src/styles/index.css',
    },
  },
  lint: {
    categories: {
      correctness: 'error',
      perf: 'warn',
      suspicious: 'error',
    },
    env: {
      browser: true,
      builtin: true,
      node: true,
    },
    ignorePatterns: ['coverage/**', 'dist/**'],
    options: {
      denyWarnings: true,
      reportUnusedDisableDirectives: 'error',
      typeAware: true,
      typeCheck: true,
    },
    plugins: [
      'eslint',
      'import',
      'jsx-a11y',
      'oxc',
      'react',
      'react-perf',
      'typescript',
      'unicorn',
    ],
    rules: {
      eqeqeq: 'error',
      'import/no-cycle': 'error',
      'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'react/exhaustive-deps': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/rules-of-hooks': 'error',
      'react/self-closing-comp': 'warn',
      'typescript/consistent-type-imports': 'warn',
      'typescript/await-thenable': 'error',
      'typescript/no-floating-promises': 'error',
      'typescript/no-misused-promises': 'error',
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
