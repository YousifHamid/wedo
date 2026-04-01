import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Navigation, Phone, MapPin, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

export default function TripStatusScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { pickupZone, dropoffZone, fareEstimate, assignedDriver, currentTrip, setTripStatus, resetTrip } = useTripStore();
  const [tripPhase, setTripPhase] = useState<'en_route_pickup' | 'arrived' | 'in_progress' | 'completed'>(
    (currentTrip?.status as any) || 'en_route_pickup'
  );

  const getZoneLabel = (zone: any) => isRTL ? zone?.nameAr : zone?.name;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for trip status updates from the driver/server
    socket.on('trip:status_updated', (data: any) => {
      console.log('[Wedo] Trip status updated:', data.status);
      if (data.status === 'arrived') {
        setTripPhase('arrived');
      } else if (data.status === 'active') {
        setTripPhase('in_progress');
      } else if (data.status === 'completed') {
        setTripPhase('completed');
        setTripStatus('completed');
        navigation.navigate('TripComplete');
      } else if (data.status === 'cancelled') {
        Alert.alert(
          isRTL ? 'تم إلغاء الرحلة' : 'Trip Cancelled',
          isRTL ? 'نعتذر، تم إلغاء هذه الرحلة.' : 'Sorry, this trip has been cancelled.',
          [{ text: 'OK', onPress: () => { resetTrip(); navigation.navigate('UserHome'); } }]
        );
      }
    });

    return () => {
      socket.off('trip:status_updated');
    };
  }, []);

  const getStatusLabel = () => {
    switch (tripPhase) {
      case 'en_route_pickup': return t('driver_arriving');
      case 'arrived': return t('arrived_pickup');
      case 'in_progress': return t('en_route');
      case 'completed': return t('trip_complete');
      default: return t('driver_arriving');
    }
  };

  const handleCall = () => {
    // In a real app, use Linking to dial
    Alert.alert(t('call_driver'), `${t('phone_label')}: ${assignedDriver?.phone || '---'}`);
  };

  const handleCancel = () => {
    Alert.alert(
      isRTL ? 'إلغاء الرحلة' : 'Cancel Trip',
      isRTL ? 'هل أنت متأكد من إلغاء الرحلة؟' : 'Are you sure you want to cancel the trip?',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: isRTL ? 'نعم، إلغاء' : 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (currentTrip?._id) {
                await api.put(`/trip/${currentTrip._id}/status`, { status: 'cancelled' });
              }
              resetTrip();
              navigation.navigate('UserHome');
            } catch (e) {
              Alert.alert('Error', 'Failed to cancel trip');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Map placeholder */}
      <View style={styles.mapBg}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={[styles.gridLine, { top: i * 40 }]} />
          ))}
        </View>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, {
          backgroundColor: tripPhase === 'in_progress' ? COLORS.primary : COLORS.warning,
        }]} />
        <Text style={styles.statusText}>{getStatusLabel()}</Text>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.progressRow}>
          <View style={styles.progressSteps}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.line, (tripPhase === 'arrived' || tripPhase === 'in_progress') && styles.lineActive]} />
            <View style={[styles.dot, (tripPhase === 'arrived' || tripPhase === 'in_progress') && styles.dotActive]} />
            <View style={[styles.line, tripPhase === 'in_progress' && styles.lineActive]} />
            <View style={[styles.dot, tripPhase === 'in_progress' && styles.dotActive]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{t('pickup_zone')}</Text>
            <Text style={styles.progressLabel}>{t('arrived_pickup')}</Text>
            <Text style={styles.progressLabel}>{t('dropoff_zone')}</Text>
          </View>
        </View>

        {/* Route Info */}
        <View style={styles.routeCard}>
          <View style={[styles.routeItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.routeIcon, { backgroundColor: '#e8f5e9' }]}>
              <MapPin color={COLORS.primary} size={16} />
            </View>
            <Text style={styles.routeText}>{getZoneLabel(pickupZone)}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={[styles.routeItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.routeIcon, { backgroundColor: '#fff3e0' }]}>
              <Navigation color={COLORS.warning} size={16} />
            </View>
            <Text style={styles.routeText}>{getZoneLabel(dropoffZone)}</Text>
          </View>
        </View>

        {/* Fare */}
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>{t('total_fare')}</Text>
          <Text style={styles.fareAmount}>{t('sdg')} {fareEstimate.toLocaleString()}</Text>
        </View>
        <Text style={styles.cashNote}>{t('pay_cash')}</Text>

        {/* Driver Info Row */}
        <View style={[styles.driverRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarText}>{assignedDriver?.name?.charAt(0) || 'A'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
            <Text style={styles.driverName}>{isRTL ? (assignedDriver?.nameAr || assignedDriver?.name) : assignedDriver?.name}</Text>
            <Text style={styles.driverVehicle}>
              {assignedDriver?.vehicleDetails?.make} {assignedDriver?.vehicleDetails?.model} • {assignedDriver?.vehicleDetails?.plateNumber}
            </Text>
          </View>
          <TouchableOpacity style={styles.callIcon} onPress={handleCall}>
            <Phone color={COLORS.onSurface} size={18} />
          </TouchableOpacity>
        </View>

        {/* Cancel Button (only shown if not in progress) */}
        {tripPhase === 'en_route_pickup' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>{t('cancel_request')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8d5b8' },
  mapBg: { flex: 1 },
  mapGrid: { flex: 1, opacity: 0.1 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.primary },

  statusBar: { position: 'absolute', top: 60, left: SPACING.xl, right: SPACING.xl, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderRadius: RADIUS.full, ...SHADOWS.md },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surfaceContainerLowest, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACING['2xl'], paddingBottom: 40, ...SHADOWS.lg },
  
  // Progress
  progressRow: { marginBottom: SPACING.xl },
  progressSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.surfaceContainerHigh },
  dotActive: { backgroundColor: COLORS.primary },
  line: { flex: 1, height: 3, backgroundColor: COLORS.surfaceContainerHigh, marginHorizontal: 4 },
  lineActive: { backgroundColor: COLORS.primary },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant },

  // Route
  routeCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  routeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  routeIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  routeText: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },
  routeDivider: { height: 1, backgroundColor: COLORS.surfaceContainerHigh, marginLeft: 44 },

  fareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  fareLabel: { fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant },
  fareAmount: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },
  cashNote: { fontSize: FONT_SIZES.xs, color: COLORS.tertiary, fontWeight: '600', marginBottom: SPACING.lg },

  driverRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: COLORS.onPrimary, fontWeight: 'bold', fontSize: FONT_SIZES.md },
  driverName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.onSurface },
  driverVehicle: { fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant },
  callIcon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },

  cancelBtn: { backgroundColor: COLORS.surfaceContainerHigh, paddingVertical: SPACING.xl, borderRadius: RADIUS.xl, alignItems: 'center' },
  cancelBtnText: { color: COLORS.onSurface, fontSize: FONT_SIZES.md, fontWeight: 'bold' },
});
