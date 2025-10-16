/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: './tsconfig.json', // ✅ 指向 client 下的 tsconfig
    tsconfigRootDir: __dirname
  },
  settings: {
    // ✅ 支援 tsconfig alias 路徑解析
    'import/resolver': {
      typescript: {
        project: './tsconfig.json'
      }
    }
  },
  rules: {
    // ✅ 忽略未使用變數與參數，只要名稱以 "_" 開頭
    '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    'no-unused-vars': 'off', // ✅ 關閉原生規則，避免與 TS 重複

    // ✅ 暫時允許使用 any 型別（可改為 warn 或補型別）
    '@typescript-eslint/no-explicit-any': 'off',

    // ✅ 可選：強制使用 type 而非 interface（視團隊風格）
    // '@typescript-eslint/consistent-type-definitions': ['warn', 'type']
  }
};