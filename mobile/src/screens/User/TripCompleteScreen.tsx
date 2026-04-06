import React, { useState, useEffect, useRef } from 'react';
import { Star, Banknote, CheckCircle, Smartphone, ArrowRight } from 'lucide-react-native';
import { Linking, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Animated, Easing, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

export default function TripCompleteScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { pickupZone, dropoffZone, fareEstimate, currentTrip, resetTrip } = useTripStore();
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  // Animations
  const checkScale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const getZoneLabel = (zone: any) => isRTL ? zone?.nameAr : zone?.name;

  const handleDone = async () => {
    const { isServerEnabled } = useAuthStore.getState();
    
    if (rating > 0 && currentTrip?._id && isServerEnabled) {
       setLoading(true);
       try {
         await api.put(`/trip/${currentTrip._id}/rate`, { rating, comment: 'Trip completed successfully' });
       } catch (e) {
         console.log('[Wedo] Failed to submit rating');
       }
    }
    
    resetTrip();
    navigation.navigate('UserHome');
  };

  const getRatingText = () => {
    if (rating === 0) return '';
    if (rating <= 2) return isRTL ? 'نتمنى تجربة أفضل القادمة' : 'We hope to do better next time';
    if (rating === 3) return isRTL ? 'شكراً لرأيك!' : 'Thanks for your feedback!';
    if (rating === 4) return isRTL ? 'رائع! سعداء إنك ارتحت' : 'Great! Glad you enjoyed it';
    return isRTL ? '⭐ ممتاز! شكراً جزيلاً' : '⭐ Excellent! Thank you so much';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Green gradient header */}
      <View style={styles.header}>
        <Animated.View style={[styles.successCircle, { transform: [{ scale: checkScale }] }]}>
          <CheckCircle color="#fff" size={44} />
        </Animated.View>
        <Text style={styles.headerTitle}>{isRTL ? 'اكتملت الرحلة!' : 'Trip Completed!'}</Text>
        <Text style={styles.headerSub}>{isRTL ? 'وصلت بأمان. شكراً لاستخدامك ودّو' : 'You arrived safely. Thanks for using Wedo'}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

          {/* Fare Card */}
          <View style={styles.fareCard}>
            <View style={styles.fareHeader}>
              <Text style={styles.fareLabelText}>{isRTL ? 'إجمالي الأجرة' : 'Total Fare'}</Text>
              <View style={styles.cashBadge}>
                <Banknote color="#ef4444" size={14} />
                <Text style={styles.cashText}>{isRTL ? 'نقدي' : 'Cash'}</Text>
              </View>
            </View>
            <Text style={styles.fareAmount}>{t('sdg')} {fareEstimate.toLocaleString()}</Text>
          </View>

          {/* Route Summary */}
          <View style={styles.routeCard}>
            <View style={[styles.routeRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.routeIndicator}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
                <View style={styles.routeLineVertical} />
                <View style={[styles.routeDot, { backgroundColor: '#f59e0b' }]} />
              </View>
              <View style={[styles.routeTexts, isRTL && { alignItems: 'flex-end' }]}>
                <View style={styles.routeSection}>
                  <Text style={styles.routeLabel}>{isRTL ? 'من' : 'From'}</Text>
                  <Text style={[styles.routeZone, isRTL && { textAlign: 'right' }]}>{getZoneLabel(pickupZone)}</Text>
                </View>
                <View style={[styles.routeSection, { marginTop: 12 }]}>
                  <Text style={styles.routeLabel}>{isRTL ? 'إلى' : 'To'}</Text>
                  <Text style={[styles.routeZone, isRTL && { textAlign: 'right' }]}>{getZoneLabel(dropoffZone)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.ratingCard}>
            <Text style={[styles.rateLabel, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'قيّم الكابتن' : 'Rate your Captain'}
            </Text>
            <Text style={[styles.rateSub, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'رأيك بهمنا جداً ويساعدنا على التحسين!' : 'Your feedback matters and helps us improve!'}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn} activeOpacity={0.7}>
                  <Star
                    color={star <= rating ? '#f59e0b' : '#d1d5db'}
                    fill={star <= rating ? '#f59e0b' : 'transparent'}
                    size={40}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingFeedback}>{getRatingText()}</Text>
            )}
          </View>

          {/* Done Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={handleDone} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={[styles.doneBtnInner, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.doneBtnText}>{isRTL ? 'إنهاء الرحلة' : 'Done'}</Text>
                <ArrowRight color="#fff" size={20} style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}} />
              </View>
            )}
          </TouchableOpacity>

          {/* Store Rating */}
          <View style={styles.storeCard}>
            <Text style={styles.thankYouTitle}>{isRTL ? 'شكراً لاختيارك ودّو! 💚' : 'Thank you for choosing Wedo! 💚'}</Text>
            <Text style={styles.thankYouSub}>{isRTL ? 'يسرنا تقييمك للتطبيق على المتجر' : 'Please rate us on the store'}</Text>
            <TouchableOpacity 
              style={styles.storeBtn} 
              onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.wedo.app')}
              activeOpacity={0.7}
            >
              <Smartphone size={16} color={COLORS.primary} />
              <Text style={styles.storeBtnText}>{isRTL ? 'قيمنا في المتجر' : 'Rate on Store'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faf5' },
  
  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },

  // Fare Card
  fareCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 16,
    ...SHADOWS.md,
  },
  fareHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  fareLabelText: { fontSize: 13, color: '#9ca3af' },
  fareAmount: { fontSize: 36, fontWeight: '900', color: COLORS.onSurface, letterSpacing: -1 },
  cashBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cashText: { fontSize: 11, fontWeight: '700', color: '#ef4444', marginLeft: 4 },

  // Route Card
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  routeRow: { flexDirection: 'row', alignItems: 'stretch' },
  routeIndicator: { alignItems: 'center', marginRight: 16, paddingVertical: 2 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeLineVertical: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  routeTexts: { flex: 1, justifyContent: 'space-between' },
  routeSection: {},
  routeLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  routeZone: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },

  // Rating Card
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  rateLabel: { fontSize: 18, fontWeight: 'bold', color: COLORS.onSurface, marginBottom: 4, width: '100%' },
  rateSub: { fontSize: 12, color: '#9ca3af', marginBottom: 16, width: '100%' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  starBtn: { paddingHorizontal: 6 },
  ratingFeedback: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 8 },

  // Done Button
  doneBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  doneBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneBtnText: { fontSize: 17, fontWeight: 'bold', color: '#fff' },

  // Store Card
  storeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', ...SHADOWS.sm },
  thankYouTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.onSurface, textAlign: 'center', marginBottom: 4 },
  thankYouSub: { fontSize: 11, color: '#9ca3af', textAlign: 'center', marginBottom: 12 },
  storeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: '#dcfce7' },
  storeBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginLeft: 8 },
});
