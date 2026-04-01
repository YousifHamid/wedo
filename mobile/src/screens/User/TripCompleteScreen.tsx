import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { Star, Banknote, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

export default function TripCompleteScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { pickupZone, dropoffZone, fareEstimate, currentTrip, resetTrip } = useTripStore();
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const getZoneLabel = (zone: any) => isRTL ? zone?.nameAr : zone?.name;

  const handleDone = async () => {
    if (rating > 0 && currentTrip?._id) {
       setLoading(true);
       try {
         await api.put(`/trip/${currentTrip._id}/rate`, {
           rating,
           comment: 'Trip completed successfully'
         });
       } catch (e) {
         console.log('[Wedo] Failed to submit rating');
       }
    }
    
    resetTrip();
    navigation.navigate('UserHome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successCircle}>
          <CheckCircle color={COLORS.onPrimary} size={48} />
        </View>

        <Text style={styles.title}>{t('trip_complete')}</Text>
        <Text style={styles.subtitle}>{t('pay_cash')}</Text>

        {/* Fare Card */}
        <View style={styles.fareCard}>
          <Text style={styles.fareLabelText}>{t('total_fare')}</Text>
          <Text style={styles.fareAmount}>{t('sdg')} {fareEstimate.toLocaleString()}</Text>
          <View style={styles.cashBadge}>
            <Banknote color={COLORS.tertiary} size={16} />
            <Text style={styles.cashText}>{t('cash_only')}</Text>
          </View>
        </View>

        {/* Route Summary */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.routeText}>{getZoneLabel(pickupZone)}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.routeText}>{getZoneLabel(dropoffZone)}</Text>
          </View>
        </View>

        {/* Rating */}
        <Text style={styles.rateLabel}>{t('rate_trip')}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
              <Star
                color={star <= rating ? '#f59e0b' : COLORS.surfaceContainerHigh}
                fill={star <= rating ? '#f59e0b' : 'transparent'}
                size={36}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Done Button */}
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.onPrimary} /> : <Text style={styles.doneBtnText}>{t('done')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING['2xl'] },
  
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  title: { fontSize: FONT_SIZES['3xl'], fontWeight: 'bold', color: COLORS.onSurface, marginBottom: SPACING.sm },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.onSurfaceVariant, marginBottom: SPACING['3xl'] },

  fareCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  fareLabelText: { fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant, marginBottom: 4 },
  fareAmount: { fontSize: FONT_SIZES.display, fontWeight: 'bold', color: COLORS.onSurface, marginBottom: SPACING.md },
  cashBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm },
  cashText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.tertiary, marginLeft: 6, letterSpacing: 0.5 },

  routeCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING['2xl'],
  },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginRight: SPACING.md },
  routeText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },
  routeLine: { width: 2, height: 20, backgroundColor: COLORS.surfaceContainerHigh, marginLeft: 4, marginVertical: 4 },

  rateLabel: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.onSurface, marginBottom: SPACING.lg },
  starsRow: { flexDirection: 'row', marginBottom: SPACING['3xl'] },
  starBtn: { paddingHorizontal: SPACING.sm },

  doneBtn: { width: '100%', backgroundColor: COLORS.primary, paddingVertical: SPACING.xl, borderRadius: RADIUS.xl, alignItems: 'center' },
  doneBtnText: { color: COLORS.onPrimary, fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
});
