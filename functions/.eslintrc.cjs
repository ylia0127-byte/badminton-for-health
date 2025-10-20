/* eslint-env node */
/* global module */

module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  extends: ['eslint:recommended', 'google', 'plugin:promise/recommended'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'promise/always-return': 'off',
    'promise/catch-or-return': 'off',
    'no-undef': 'off',
    quotes: ['error', 'double', { allowTemplateLiterals: true }],
  },
  ignorePatterns: ['node_modules/**', 'lib/**'],
}
