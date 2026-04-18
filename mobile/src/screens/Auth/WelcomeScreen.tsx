import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Animated } from 'react-native';
import { Car, UserCheck, ChevronRight, ChevronLeft, Languages, MapPin, ShieldCheck, Route, Navigation } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import useAuthStore from '../../store/useAuthStore';
import '../../i18n';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { isServerEnabled, setMockUser } = useAuthStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Splash animation removed as requested
  }, []);

  const handleRoleSelect = (role: 'rider' | 'driver') => {
    navigation.navigate('Login', { role });
  };

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLng);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Top Half: Dark Luxury Cover Image */}
      <View style={styles.imageContainer}>
         <Image 
            source={{ uri: 'file:///C:/Users/MANDO/.gemini/antigravity/brain/b0561f02-72ee-4ff7-803b-70eef60a7f3d/media__1776260257553.jpg' }} 
            style={styles.coverImage} 
            resizeMode="cover" 
         />
         <View style={styles.imageOverlay} />
      </View>

      {/* Header Layer */}
      <View style={[styles.topNav, { top: Math.max(insets.top, 20) + 32, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
         <Text style={styles.brandLogoHeader}>Wedo</Text>
         <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn} activeOpacity={0.8}>
            <Text style={styles.langBtnText}>{i18n.language === 'ar' ? 'EN' : 'عربي'}</Text>
         </TouchableOpacity>
      </View>

      {/* Custom Full-Width Image Area */}
      <View style={styles.midDecorationContainer} pointerEvents="none">
         <Image 
            source={require('../../../assets/mainscreen.png')} 
            style={{ width: '100%', height: '100%', opacity: 1 }} 
            resizeMode="cover"
         />
      </View>

      {/* Bottom Half: Premium Text & Buttons */}
      <View style={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 16) + 20 }]}>
         <Text style={[styles.title, isRTL && styles.textRight]}>{t('premium_cars')}</Text>
         <Text style={[styles.subtitle, isRTL && styles.textRight]}>
            {t('premium_desc')}
         </Text>

         <View style={styles.actionContainer}>
            {/* Primary Pill Button (Rider) */}
            <TouchableOpacity 
              style={styles.primaryButton}
              activeOpacity={0.9}
              onPress={() => handleRoleSelect('rider')}
            >
              <Text style={styles.primaryButtonText}>{t('passenger_go')}</Text>
            </TouchableOpacity>

            {/* Secondary Pill Button (Driver) */}
            <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={() => handleRoleSelect('driver')}
            >
              <Text style={styles.secondaryButtonText}>{t('driver_earn')}</Text>
            </TouchableOpacity>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1B1F' },
  
  imageContainer: {
    width: '100%',
    height: '60%', 
    position: 'absolute',
    top: 0,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 27, 31, 0.4)', // Fades the image slightly to blend
  },
  
  topNav: { 
    position: 'absolute', left: 0, right: 0, 
    justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
    paddingHorizontal: 24,
  },
  brandLogoHeader: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  langBtn: { 
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 18, paddingVertical: 10, 
    borderRadius: RADIUS.full 
  },
  langBtnText: { fontWeight: '900', color: '#FFFFFF', fontSize: FONT_SIZES.sm },
  
  midDecorationContainer: {
    position: 'absolute',
    top: '18%', 
    left: 0,
    right: 0,
    height: '30%', // Reduced highly to keep away from bottom text
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 5,
    borderRadius: 32, // Creating the requested curved/canvas edges
  },
  roadLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
    borderRadius: 1,
  },
  dashedRoute: {
    position: 'absolute',
    width: 1,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
    opacity: 0.4,
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: SPACING.lg,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: '#9CA3AF',
    lineHeight: 22,
    marginBottom: SPACING['2xl'],
  },
  textRight: { textAlign: 'right' },
  
  actionContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: '#D1D5DB', // Authentic 3D Pop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: '#000000',
  },
  secondaryButton: {
    backgroundColor: '#1C1C1E',
    width: '100%',
    borderRadius: RADIUS.full,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: '#000000', // 3D Dark Pop
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
