import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Alert } from 'react-native';
import { Target, Phone, MessageSquare, X, Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function SearchingScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { pickupZone, dropoffZone, fareEstimate, vehicleType, setTripStatus, setAssignedDriver, setCurrentTrip, resetTrip } = useTripStore();
  
  const [phase, setPhase] = useState<'searching' | 'assigned'>('searching');
  const [assignedDriverData, setAssignedDriverData] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Request trip via API
    const requestTrip = async () => {
      try {
        const response = await api.post('/trip/request', {
          pickupZoneId: pickupZone?._id,
          dropoffZoneId: dropoffZone?._id,
          vehicleType: vehicleType,
        });

        const { trip, dispatchedTo, driverAssigned } = response.data;
        setCurrentTrip(trip);

        if (driverAssigned && trip.driver) {
          // Driver already assigned
          handleDriverAssigned(trip.driver);
        }
        // Otherwise, listen for socket events
      } catch (error: any) {
        const msg = error.response?.data?.message;
        Alert.alert(
          t('error'),
          msg || (isRTL ? 'فشل في طلب الرحلة. حاول مرة أخرى.' : 'Failed to request trip. Try again.'),
          [{ text: 'OK', onPress: () => { resetTrip(); navigation.goBack(); } }]
        );
      }
    };

    requestTrip();

    // Listen for driver assignment via socket
    const socket = getSocket();
    if (socket) {
      socket.on('trip:driver_responded', (data: any) => {
        if (data.response === 'accepted') {
          handleDriverAssigned(data);
        }
      });

      socket.on('trip:status_updated', (data: any) => {
        if (data.status === 'accepted') {
          handleDriverAssigned(data);
        } else if (data.status === 'cancelled') {
          Alert.alert(
            isRTL ? 'تم إلغاء الرحلة' : 'Trip Cancelled',
            isRTL ? 'لا يوجد سائقين متاحين حاليًا' : 'No drivers available at the moment',
            [{ text: 'OK', onPress: () => { resetTrip(); navigation.goBack(); } }]
          );
        }
      });
    }

    return () => {
      pulse.stop();
      if (socket) {
        socket.off('trip:driver_responded');
        socket.off('trip:status_updated');
      }
    };
  }, []);

  const handleDriverAssigned = (driverData: any) => {
    setAssignedDriverData(driverData);
    setAssignedDriver(driverData);
    setTripStatus('assigned');
    setPhase('assigned');
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 9 }).start();
  };

  const handleCancel = async () => {
    try {
      const trip = useTripStore.getState().currentTrip;
      if (trip?._id) {
        await api.put(`/trip/${trip._id}/status`, { status: 'cancelled' });
      }
    } catch (e) {}
    resetTrip();
    navigation.goBack();
  };

  const handleContinue = () => {
    navigation.navigate('TripStatus');
  };

  const driverName = assignedDriverData?.name || assignedDriverData?.driverName || 'Driver';
  const driverNameAr = assignedDriverData?.nameAr || driverName;

  return (
    <View style={styles.container}>
      {/* Map placeholder background */}
      <View style={styles.mapBg}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={[styles.gridLine, { top: i * 40 }]} />
          ))}
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.brandText, { color: '#000000' }]}>Wedo</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{t('online')}</Text>
        </View>
        <TouchableOpacity>
          <Bell color={COLORS.onSurfaceVariant} size={22} />
        </TouchableOpacity>
      </View>

      {/* Searching Card */}
      {phase === 'searching' && (
        <View style={styles.searchCard}>
          <View style={styles.searchCardInner}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.searchTitle, isRTL && styles.textRight]}>{t('finding_ride')}</Text>
              <Text style={[styles.searchSub, isRTL && styles.textRight]}>{t('matching_driver')}</Text>
            </View>
            <Animated.View style={[styles.pulseCircle, { opacity: pulseAnim }]}>
              <Target color={COLORS.primary} size={28} />
            </Animated.View>
          </View>

          <View style={styles.searchInfoRow}>
            <View style={[styles.infoBox, { marginRight: SPACING.md }]}>
              <Text style={styles.infoLabel}>{t('estimated_price').toUpperCase()}</Text>
              <Text style={styles.infoValue}>{t('sdg')} {fareEstimate.toLocaleString()}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>{t('vehicle_type').toUpperCase()}</Text>
              <Text style={styles.infoValue}>
                {vehicleType === 'premium' ? t('mashi_premium') : t('mashi_standard')}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>{t('cancel_request')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Driver Assigned Card */}
      {phase === 'assigned' && (
        <Animated.View style={[styles.assignedContainer, { transform: [{ translateY: slideAnim }] }]}>
          {/* Driver Info Card */}
          <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <Text style={[styles.assignedLabel, isRTL && styles.textRight]}>{t('driver_assigned').toUpperCase()}</Text>
              <View style={styles.etaBadge}>
                <Text style={styles.etaLabel}>{t('eta')}</Text>
                <Text style={styles.etaValue}>5</Text>
                <Text style={styles.etaUnit}>{t('min')}</Text>
              </View>
            </View>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <Text style={styles.avatarText}>{driverName.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{isRTL ? driverNameAr : driverName}</Text>
                <Text style={styles.driverRating}>⭐ {assignedDriverData?.reliabilityScore || '4.9'}</Text>
              </View>
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleLabel}>{t('vehicle').toUpperCase()}</Text>
              <Text style={styles.vehicleName}>
                {assignedDriverData?.vehicleDetails?.make} {assignedDriverData?.vehicleDetails?.model}
              </Text>
              <Text style={styles.vehicleDesc}>
                {assignedDriverData?.vehicleDetails?.color} • {assignedDriverData?.vehicleDetails?.year}
              </Text>
            </View>
            <View style={styles.plateBadge}>
              <Text style={styles.plateLabel}>{t('plate_number').toUpperCase()}</Text>
              <Text style={styles.plateNumber}>{assignedDriverData?.vehicleDetails?.plateNumber || '---'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.callBtn}>
              <Phone color={COLORS.onSurface} size={18} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreBtn}>
              <MessageSquare color={COLORS.onSurface} size={18} />
            </TouchableOpacity>
          </View>

          {/* Track Trip Button */}
          <View style={styles.trackRow}>
            <TouchableOpacity style={styles.trackBtn} onPress={handleContinue}>
              <Text style={styles.trackBtnText}>{t('trip_in_progress')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8d5b8' },
  mapBg: { flex: 1, position: 'relative' },
  mapGrid: { flex: 1, opacity: 0.15 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.primary },
  
  // Header
  header: { position: 'absolute', top: 50, left: SPACING.xl, right: SPACING.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandText: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 6 },
  onlineText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.onSurface },

  textRight: { textAlign: 'right' },

  // Search Card
  searchCard: { position: 'absolute', top: 100, left: SPACING.xl, right: SPACING.xl, backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS['2xl'], padding: SPACING['2xl'], ...SHADOWS.lg },
  searchCardInner: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  searchTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.primary },
  searchSub: { fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant, marginTop: 4 },
  pulseCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  searchInfoRow: { flexDirection: 'row', marginBottom: SPACING.xl },
  infoBox: { flex: 1, backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.lg, padding: SPACING.lg },
  infoLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 1, marginBottom: 4 },
  infoValue: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },
  cancelBtn: { backgroundColor: COLORS.surfaceContainerHigh, paddingVertical: SPACING.lg, borderRadius: RADIUS.xl, alignItems: 'center' },
  cancelBtnText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },

  // Assigned
  assignedContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], overflow: 'hidden' },
  driverCard: { backgroundColor: COLORS.primaryContainer, padding: SPACING['2xl'], paddingBottom: SPACING.xl },
  driverHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  assignedLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.onPrimaryContainer, letterSpacing: 1.5 },
  etaBadge: { backgroundColor: COLORS.primaryFixed, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, alignItems: 'center' },
  etaLabel: { fontSize: 9, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  etaValue: { fontSize: FONT_SIZES['2xl'], fontWeight: 'bold', color: COLORS.primary },
  etaUnit: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.primary },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.lg },
  avatarText: { color: COLORS.onPrimary, fontSize: FONT_SIZES.xl, fontWeight: 'bold' },
  driverName: { fontSize: FONT_SIZES['2xl'], fontWeight: 'bold', color: COLORS.onPrimary },
  driverRating: { fontSize: FONT_SIZES.sm, color: COLORS.onPrimaryContainer, marginTop: 2 },

  // Vehicle
  vehicleCard: { backgroundColor: COLORS.surfaceContainerLowest, padding: SPACING['2xl'], flexDirection: 'row', alignItems: 'center' },
  vehicleLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 1, marginBottom: 4 },
  vehicleName: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.onSurface },
  vehicleDesc: { fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant, marginTop: 2 },
  plateBadge: { backgroundColor: COLORS.primaryContainer, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, alignItems: 'center' },
  plateLabel: { fontSize: 9, fontWeight: '700', color: COLORS.onPrimaryContainer, letterSpacing: 1 },
  plateNumber: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onPrimary, marginTop: 2 },

  // Actions
  actionRow: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainerLowest, paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING.xl, justifyContent: 'center' },
  callBtn: { width: 50, height: 50, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  moreBtn: { width: 50, height: 50, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  trackRow: { backgroundColor: COLORS.surfaceContainerLowest, paddingHorizontal: SPACING['2xl'], paddingVertical: SPACING.lg, paddingBottom: 40 },
  trackBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.xl, borderRadius: RADIUS.xl, alignItems: 'center', ...SHADOWS.md },
  trackBtnText: { color: COLORS.onPrimary, fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
});
