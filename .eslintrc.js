/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // 忽略未使用變數與參數，只要名稱以 "_" 開頭
    '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    'no-unused-vars': ['warn', { varsIgnorePattern: '^_' }],

    // 暫時允許使用 any 型別（可改為 warn 或補型別）
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
