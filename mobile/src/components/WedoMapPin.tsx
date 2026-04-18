/**
 * WedoMapPin.tsx — Professional branded map pin for Wedo
 * Uses react-native-svg for crisp vector rendering.
 * Supports: floating animation, shadow, drag state.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, Defs, RadialGradient, Stop, DropShadow, Filter } from 'react-native-svg';
import { COLORS } from '../constants/theme';

interface WedoMapPinProps {
  /** Whether the pin is being dragged (floats up + bigger shadow) */
  isDragging?: boolean;
  size?: number;
  color?: string;
  label?: string;
}

export default function WedoMapPin({ isDragging = false, size = 52, color = COLORS.primary, label }: WedoMapPinProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isDragging) {
      Animated.parallel([
        Animated.spring(floatAnim, { toValue: -20, tension: 180, friction: 5, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1.15, tension: 180, friction: 5, useNativeDriver: true }),
        Animated.spring(shadowScaleAnim, { toValue: 2.2, tension: 180, friction: 5, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(floatAnim, { toValue: 0, tension: 200, friction: 7, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
        Animated.spring(shadowScaleAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
      ]).start();
    }
  }, [isDragging]);

  const pinW = size;
  const pinH = size * 1.35;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Pin body */}
      <Animated.View style={{ transform: [{ translateY: floatAnim }, { scale: scaleAnim }] }}>
        <Svg width={pinW} height={pinH} viewBox="0 0 52 70">
          <Defs>
            <RadialGradient id="pinGrad" cx="40%" cy="30%" r="65%">
              <Stop offset="0%" stopColor="#40A8FF" />
              <Stop offset="100%" stopColor={color} />
            </RadialGradient>
          </Defs>

          {/* Main teardrop body */}
          <Path
            d="M26 2 C12 2 2 12 2 24 C2 40 26 68 26 68 C26 68 50 40 50 24 C50 12 40 2 26 2 Z"
            fill="url(#pinGrad)"
          />

          {/* Inner highlight top-left for 3D effect */}
          <Path
            d="M26 6 C15 6 7 14 7 24 C7 36 20 56 26 64"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* White circle background for logo */}
          <Circle cx="26" cy="23" r="13" fill="white" opacity={0.95} />

          {/* "W" letter */}
          <SvgText
            x="26"
            y="28.5"
            textAnchor="middle"
            fontSize="14"
            fontWeight="900"
            fill={color}
            letterSpacing="-0.5"
          >
            W
          </SvgText>
        </Svg>
      </Animated.View>

      {/* Shadow dot under pin */}
      <Animated.View
        style={[
          styles.shadow,
          {
            opacity: isDragging ? 0.12 : 0.3,
            transform: [{ scaleX: shadowScaleAnim }, { scaleY: 0.4 }],
          },
        ]}
      />

      {/* Optional label bubble */}
      {label && (
        <View style={styles.labelBubble}>
          {/* label not rendered directly here, passed via parent */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  shadow: {
    width: 20,
    height: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginTop: -6,
  },
  labelBubble: {
    marginTop: 4,
  },
});
