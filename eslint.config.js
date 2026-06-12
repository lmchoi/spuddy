const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');
const sonarjs = require('eslint-plugin-sonarjs');

module.exports = defineConfig([
  ...expo,
  sonarjs.configs.recommended,
  prettier,
  {
    // slow-regex: mobile app running on local user data — ReDoS requires an adversary
    // controlling input to a long-running server, which doesn't apply here.
    // no-nested-functions: setDay(prev => prev.exercises.map(...)) is standard React
    // state updater pattern; the nesting is idiomatic, not a complexity smell.
    rules: {
      'sonarjs/slow-regex': 'off',
      'sonarjs/no-nested-functions': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: { require: 'readonly', __dirname: 'readonly', console: 'readonly', module: 'readonly' },
    },
  },
  {
    ignores: ['.claude/**', 'docs/**', 'design_handoffs/**'],
  },
]);
