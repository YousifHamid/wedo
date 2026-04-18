import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function FastIntroScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.brandText}>Wedo</Text>
        <View style={styles.line} />
        <Text style={styles.tagline}>ويدو خيارك الأول وين ما تمشي</Text>
      </Animated.View>
      
      <View style={styles.footer}>
         <Text style={styles.madeWithTrust}>صمم بأيدي سودانية وبثقة 🇸🇩</Text>
         <Text style={styles.footerText}>بواسطة Wedo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logoContainer: { 
    alignItems: 'center' 
  },
  brandText: { 
    fontSize: 72, 
    fontWeight: '900', 
    color: '#000000',
    letterSpacing: -3,
    marginBottom: SPACING.xs,
  },
  line: { 
    width: 40, height: 4, 
    backgroundColor: COLORS.primary, 
    borderRadius: 2, 
    marginVertical: SPACING.sm 
  },
  tagline: { 
    fontSize: FONT_SIZES.lg, 
    color: COLORS.onSurfaceVariant, 
    fontWeight: '500' 
  },
  footer: { 
    position: 'absolute', 
    bottom: 50,
    alignItems: 'center'
  },
  madeWithTrust: {
    fontSize: FONT_SIZES.sm,
    color: '#000000',
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  footerText: { 
    fontSize: FONT_SIZES.xs, 
    color: COLORS.outlineVariant, 
    letterSpacing: 2 
  }
});
