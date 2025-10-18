/* eslint-env node */
/* global module */

module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: ['eslint:recommended', 'google', 'plugin:promise/recommended'],
  rules: {
    // 常见小噪音做容忍
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'promise/always-return': 'off',
    'promise/catch-or-return': 'off',
    // 根因：ESM 环境下由 bundler/平台注入，不必对 no-undef 过度敏感
    'no-undef': 'off',
    // Google 风格默认强制很多格式，可按需继续放宽
    quotes: ['error', 'double', { allowTemplateLiterals: true }],
  },
  ignorePatterns: ['node_modules/**', 'lib/**'],
}
