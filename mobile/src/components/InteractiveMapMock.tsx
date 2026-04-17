/**
 * InteractiveMapMock.tsx
 * 
 * Uber-style interactive map for Expo Go:
 * - Single finger: pan (grid moves OPPOSITE = map feeling)
 * - Two fingers: pinch-to-zoom
 * - Release: smooth momentum decay
 * - Center pin: rises when dragging, drops when released
 * - Always-fixed pin at screen center
 */
import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Animated, PanResponder } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

interface Driver {
  id: string;
  top: string;
  left: string;
  rot: string;
}

interface Props {
  style?: any;
  drivers?: Driver[];
  onDragStart?: () => void;
  onDragEnd?: () => void;
  renderChildren?: () => React.ReactNode;
}

const GRID_H = Array.from({ length: 30 });
const GRID_V = Array.from({ length: 20 });

export default function InteractiveMapMock({ style, drivers = [], onDragStart, onDragEnd, renderChildren }: Props) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pinFloatAnim = useRef(new Animated.Value(0)).current;

  const lastScaleRef = useRef(1);
  const lastDistRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const decayRef = useRef<Animated.CompositeAnimation | null>(null);

  const getDistance = (touches: any[]): number | null => {
    if (touches.length < 2) return null;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const startDrag = useCallback(() => {
    if (isDraggingRef.current) return;
    isDraggingRef.current = true;
    // Stop any ongoing decay
    decayRef.current?.stop();
    onDragStart?.();
    Animated.spring(pinFloatAnim, {
      toValue: 1,
      tension: 120,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [onDragStart]);

  const endDrag = useCallback((vx: number, vy: number) => {
    isDraggingRef.current = false;
    lastDistRef.current = null;
    onDragEnd?.();
    Animated.spring(pinFloatAnim, {
      toValue: 0,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Momentum decay — smooth slide after lifting finger
    decayRef.current = Animated.decay(pan, {
      velocity: { x: -vx * 1.2, y: -vy * 1.2 }, // negative = map scrolls opposite
      deceleration: 0.993,
      useNativeDriver: false,
    });
    decayRef.current.start();
  }, [onDragEnd, pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 2 || Math.abs(gs.dy) > 2,

      onPanResponderGrant: (e) => {
        // Flatten last offset so pan continues from current position
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });

        if (e.nativeEvent.touches.length === 1) {
          startDrag();
        }
        lastDistRef.current = null;
      },

      onPanResponderMove: (e, gs) => {
        const touches = Array.from(e.nativeEvent.touches);

        if (touches.length >= 2) {
          // ── Pinch to zoom ──────────────────────────────────
          const dist = getDistance(touches);
          if (dist !== null && lastDistRef.current !== null) {
            const factor = dist / lastDistRef.current;
            lastScaleRef.current = Math.min(3.5, Math.max(0.4, lastScaleRef.current * factor));
            scaleAnim.setValue(lastScaleRef.current);
          }
          lastDistRef.current = dist;
        } else {
          // ── Single finger pan ──────────────────────────────
          if (!isDraggingRef.current) startDrag();
          // Move grid OPPOSITE to finger → map feel
          pan.x.setValue(-gs.dx);
          pan.y.setValue(-gs.dy);
        }
      },

      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        endDrag(gs.vx, gs.vy);
      },

      onPanResponderTerminate: (_, gs) => {
        pan.flattenOffset();
        endDrag(gs.vx, gs.vy);
      },
    })
  ).current;

  // Pin lift amount when dragging
  const pinTranslateY = pinFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const shadowOpacity = pinFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.1],
  });
  const shadowScaleX = pinFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>

      {/* ── Animated map grid (moves with pan + scales with pinch) ── */}
      <Animated.View
        style={[
          styles.gridLayer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scaleAnim },
            ],
          },
        ]}
        pointerEvents="none"
      >
        {/* Background */}
        <View style={styles.gridBg} />
        {/* H lines */}
        {GRID_H.map((_, i) => (
          <View
            key={`h${i}`}
            style={[styles.lineH, { top: `${(i / (GRID_H.length - 1)) * 140 - 20}%` }]}
          />
        ))}
        {/* V lines */}
        {GRID_V.map((_, i) => (
          <View
            key={`v${i}`}
            style={[styles.lineV, { left: `${(i / (GRID_V.length - 1)) * 140 - 20}%` }]}
          />
        ))}
        {/* Driver car markers — move with map */}
        {drivers.map((car) => (
          <View
            key={car.id}
            style={[styles.carMarker, { top: car.top as any, left: car.left as any }]}
          >
            <View style={[styles.carCircle, { transform: [{ rotate: car.rot }] }]}>
              {/* Simple car shape */}
              <View style={styles.carBody} />
              <View style={styles.carRoof} />
            </View>
          </View>
        ))}
        {/* Extra children rendered inside grid (move with map) */}
        {renderChildren && renderChildren()}
      </Animated.View>

      {/* ── Center pin — ALWAYS FIXED at screen center ── */}
      <View style={styles.pinArea} pointerEvents="none">
        <Animated.View style={[styles.pinWrapper, { transform: [{ translateY: pinTranslateY }] }]}>
          <View style={styles.luxuryPin}>
            <View style={styles.luxuryPinInner} />
            <View style={styles.luxuryPinStem} />
          </View>
        </Animated.View>
        {/* Shadow dot under pin */}
        <Animated.View
          style={[
            styles.pinShadow,
            { opacity: shadowOpacity, transform: [{ scaleX: shadowScaleX }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    // Make grid larger than screen to avoid empty edges while panning
    margin: -200,
    top: -200,
    left: -200,
    right: -200,
    bottom: -200,
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  lineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#2AA84A',
    opacity: 0.18,
  },
  lineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#2AA84A',
    opacity: 0.18,
  },
  // Driver car
  carMarker: {
    position: 'absolute',
  },
  carCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    // 3D shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  carBody: {
    width: 14,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  carRoof: {
    position: 'absolute',
    width: 8,
    height: 5,
    backgroundColor: '#e8f5e9',
    borderRadius: 2,
    top: 5,
  },
  // Pin
  pinArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinWrapper: {
    marginBottom: 52,
    alignItems: 'center',
  },
  luxuryPin: {
    alignItems: 'center',
  },
  luxuryPinInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    borderWidth: 6,
    borderColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 2,
  },
  luxuryPinStem: {
    width: 4,
    height: 24,
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -4,
    zIndex: 1,
  },
  pinShadow: {
    width: 18,
    height: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.28)',
    marginTop: -4,
  },
});
