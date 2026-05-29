const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');
const sonarjs = require('eslint-plugin-sonarjs');

module.exports = defineConfig([
  ...expo,
  sonarjs.configs.recommended,
  prettier,
  {
    ignores: ['.claude/**', 'docs/**', 'design_handoffs/**'],
  },
]);
