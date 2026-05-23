const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite uses a WASM web worker that Metro can't resolve on web.
// Block the import so web bundling doesn't fail.
config.resolver.blockList = [
  ...(config.resolver.blockList ?? []),
  /expo-sqlite\/web\/wa-sqlite\/.*\.wasm/,
];

module.exports = withNativewind(config);
