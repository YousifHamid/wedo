import React, { useRef, useState, useEffect } from 'react';
import { View, Animated, PanResponder, StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeableBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapIndex?: number;
  onSnap?: (index: number) => void;
  style?: any;
}

export default function SwipeableBottomSheet({
  children,
  snapPoints = [400, 150], // Default heights: tall, short
  initialSnapIndex = 0,
  onSnap,
  style
}: SwipeableBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const panY = useRef(new Animated.Value(0)).current;

  // Max visible height decides the actual physical container height so it doesn't crush flex layouts
  const MAX_HEIGHT = Math.max(...snapPoints);
  
  // We keep track of the current active snap point
  const currentSnap = useRef(snapPoints[initialSnapIndex]);
  const [activeSnap, setActiveSnap] = useState(snapPoints[initialSnapIndex]);

  // The base offset pushes the sheet down to hide the top part
  const baseOffset = MAX_HEIGHT - activeSnap;

  useEffect(() => {
    Animated.spring(panY, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true // We can use native driver now since we only animate transform
    }).start();
  }, [activeSnap]);

  const translateY = panY.interpolate({
    inputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT],
    outputRange: [-SCREEN_HEIGHT + baseOffset, SCREEN_HEIGHT + baseOffset],
    extrapolate: 'clamp'
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.vy) > 0.2;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0 && currentSnap.current === MAX_HEIGHT) {
           panY.setValue(gestureState.dy * 0.3); // Resist pulling up past max
        } else {
           panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Did the user pull down or up?
        const currentVisibleHeight = currentSnap.current - gestureState.dy;

        // Find the closest snap point
        const closestSnap = snapPoints.reduce((prev, curr) => {
          return (Math.abs(curr - currentVisibleHeight) < Math.abs(prev - currentVisibleHeight) ? curr : prev);
        });

        const snapOffset = currentSnap.current - closestSnap;
        currentSnap.current = closestSnap;

        // Update React state which re-calculates baseOffset
        setActiveSnap(closestSnap);

        if (onSnap) {
           onSnap(snapPoints.indexOf(closestSnap));
        }

        // Visually animate to 0 from the simulated difference
        // @ts-ignore
        panY.setValue(panY._value - snapOffset);
        Animated.spring(panY, {
          toValue: 0,
          tension: 60,
          friction: 9,
          useNativeDriver: true
        }).start();
      }
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        { height: MAX_HEIGHT + insets.bottom, transform: [{ translateY }] },
        style
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.draggerZone}>
        <View style={styles.draggerHandler} />
      </View>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOWS.lg,
    zIndex: 100,
  },
  draggerZone: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draggerHandler: {
    width: 45,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
  }
});
