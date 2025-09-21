/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // 忽略未使用變數與參數，只要名稱以 "_" 開頭
    '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    'no-unused-vars': ['warn', { varsIgnorePattern: '^_' }],

    // 暫時允許使用 any 型別（可改為 warn 或補型別）
    '@typescript-eslint/no-explicit-any': 'off',

    // 允許 JSX 中使用未定義的變數（避免誤判）
    'react/jsx-uses-vars': 'warn',

    // 允許 JSX 中使用未定義的元件（避免誤判）
    'react/jsx-uses-react': 'warn',

    // 允許 Prettier 自動格式化
    'prettier/prettier': ['warn'],
  },
};
