const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

const nativeOnlyModules = new Set([
  'react-native-nitro-modules',
  'react-native-mmkv',
  'react-native-nitro-fetch',
]);

const webOnlyModules = new Set(['@react-native-async-storage/async-storage']);

config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'mjs', 'cjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return {
      filePath: require.resolve(moduleName),
      type: 'sourceFile',
    };
  }

  if (platform === 'web') {
    // Ignore native-only modules on web
    if (nativeOnlyModules.has(moduleName)) {
      return { type: 'empty' };
    }
  } else {
    // Ignore web-only modules on native
    if (webOnlyModules.has(moduleName)) {
      return { type: 'empty' };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withUniwindConfig(config, {
  // relative path to your global.css file (from previous step)
  cssEntryFile: './global.css',
  // (optional) path where we gonna auto-generate typings
  // defaults to project's root
  dtsFile: './uniwind-types.d.ts',
});
