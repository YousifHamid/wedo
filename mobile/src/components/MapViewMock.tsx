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

export const SafeMarker = ({ children, coordinate, style }: any) => (
  <View style={[styles.markerWrap, style]}>{children}</View>
);

import Svg, { Path } from 'react-native-svg';

export const SafePolyline = ({ coordinates, strokeColor = '#000', strokeWidth = 4, lineDashPattern }: any) => {
  // Simple fake route path overlay to simulate real maps
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Path
          d="M 100,500 L 150,450 L 120,380 L 250,280 L 220,180 L 300,100"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={lineDashPattern ? `${lineDashPattern[0]}, ${lineDashPattern[1]}` : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export const isMapAvailable = false;
export const PROVIDER_GOOGLE = null;
export const PROVIDER_DEFAULT = null;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1B1F', // Matte Black background
    overflow: 'hidden',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  lineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  lineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#FFFFFF',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    opacity: 0.4,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#000',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  markerWrap: {
    position: 'absolute',
  },
});
