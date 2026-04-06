/**
 * Mock for react-native-maps
 * Used in Expo Go where native maps modules are not available.
 * The real library is used in production EAS builds.
 */
const React = require('react');
const { View, StyleSheet } = require('react-native');

const MockMap = (props) => {
  return React.createElement(View, {
    style: [{ flex: 1, backgroundColor: '#dff0d8' }, props.style],
  }, props.children);
};

const MockMarker = (props) => {
  return props.children ? React.createElement(View, null, props.children) : null;
};

MockMap.Marker = MockMarker;

module.exports = MockMap;
module.exports.default = MockMap;
module.exports.Marker = MockMarker;
module.exports.PROVIDER_GOOGLE = null;
module.exports.PROVIDER_DEFAULT = null;
