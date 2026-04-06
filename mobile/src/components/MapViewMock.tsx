/**
 * SafeMapView - Clean map placeholder for Expo Go.
 * Shows a green grid map with animated center pin and driver car markers.
 * In EAS builds, the real react-native-maps is used instead.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export const SafeMapView = ({ style, children, ...props }: any) => {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* Grid lines */}
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.lineH, { top: `${(i / 19) * 100}%` }]} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.lineV, { left: `${(i / 11) * 100}%` }]} />
        ))}
      </View>

      {/* Center location pin */}
      <View style={styles.centerPin} pointerEvents="none">
        <Animated.View style={[styles.pulseRing, { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.pinDot} />
      </View>

      {children}
    </View>
  );
};

export const SafeMarker = ({ children, coordinate }: any) => (
  <View style={styles.markerWrap}>{children}</View>
);

export const isMapAvailable = false;
export const PROVIDER_GOOGLE = null;
export const PROVIDER_DEFAULT = null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    overflow: 'hidden',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  lineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2AA84A',
  },
  lineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#2AA84A',
  },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2AA84A',
    opacity: 0.4,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2AA84A',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  markerWrap: {
    position: 'absolute',
  },
});
