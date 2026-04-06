const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Mock react-native-maps in Expo Go to prevent TurboModule crashes.
// In EAS builds, EAS_BUILD env var is set so the real library is used.
if (!process.env.EAS_BUILD) {
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react-native-maps': require.resolve('./__mocks__/react-native-maps.js'),
  };
}

module.exports = config;
