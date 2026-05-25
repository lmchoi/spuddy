const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite uses a WASM web worker that Metro can't resolve on web.
// We block it entirely for web bundles to prevent resolution errors.
config.resolver.blockList = [
  ...(config.resolver.blockList ?? []),
  /expo-sqlite\/web\/wa-sqlite\/.*\.wasm/,
  /expo-sqlite\/web\/worker\.ts/,
  /expo-sqlite\/web\/worker\.js/,
];

// Provide a mock for expo-sqlite on web since we don't need it in Storybook
if (process.env.EXPO_PUBLIC_STORYBOOK === '1') {
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'expo-sqlite') {
      return {
        type: 'empty',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = withStorybook(withNativewind(config), {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK === '1',
  configPath: './.storybook',
  liteMode: true,
});
