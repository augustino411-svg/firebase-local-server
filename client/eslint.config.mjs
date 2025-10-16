import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  },
  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json', // ✅ 指向 client 下的 tsconfig
        tsconfigRootDir: new URL('.', import.meta.url).pathname
      },
      globals: {
        require: 'readonly',
        process: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        Request: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLElement: 'readonly',
        ReadableStream: 'readonly',
        TransformStream: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'next': nextPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,

      // ✅ 自訂規則
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'off'
    }
  }
];