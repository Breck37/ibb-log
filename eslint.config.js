// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions is Deno (its own globals, jsr: and .ts import specifiers).
    ignores: ['dist/*', 'scripts/*', 'supabase/functions/*'],
  },
]);
