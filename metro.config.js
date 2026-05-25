const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite uses a WASM web worker that Metro can't resolve on web.
// Block the import so web bundling doesn't fail.
// We use blockList for native and also ensure it's handled for web.
config.resolver.blockList = [
  ...(config.resolver.blockList ?? []),
  /expo-sqlite\/web\/wa-sqlite\/.*\.wasm/,
  /expo-sqlite\/web\/worker\.ts/,
];

module.exports = withStorybook(withNativewind(config), {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK === '1',
  configPath: './.storybook',
  liteMode: true,
});
