import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Share, Modal, Platform, Dimensions, Image, Linking } from 'react-native';
import { Navigation, Phone, MapPin, ChevronRight, AlertCircle, PlusCircle, Share2, ShieldAlert, Car, Star, X, Clock, User, ChevronLeft } from 'lucide-react-native';
import CustomAlert from '../../components/CustomAlert';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import useAuthStore from '../../store/useAuthStore';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { SafeMapView as MapView, SafeMarker as Marker, SafePolyline as Polyline } from '../../components/MapViewMock';
import { SILVER_MAP_STYLE } from '../../constants/mapStyle';
import SwipeableBottomSheet from '../../components/SwipeableBottomSheet';


const { width } = Dimensions.get('window');

export default function TripStatusScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { pickupZone, dropoffZone, fareEstimate, assignedDriver, currentTrip, setTripStatus, resetTrip, stops, addStop } = useTripStore();
  const [tripPhase, setTripPhase] = useState<'en_route_pickup' | 'arrived' | 'in_progress' | 'completed'>(
    (currentTrip?.status as any) || 'en_route_pickup'
  );
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Real driver position from socket (lat/lng)
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  // ETA in minutes based on real distance
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  // Trip elapsed timer (seconds since trip started)
  const [tripElapsedSec, setTripElapsedSec] = useState(0);
  const tripStartedAt = React.useRef<number | null>(null);

  // Haversine distance formula (km)
  const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getZoneLabel = (zone: any) => isRTL ? zone?.nameAr : zone?.name;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join the trip room
    if (currentTrip?._id) {
      socket.emit('trip:join_room', currentTrip._id);
    }

    // Listen for trip status updates
    socket.on('trip:status_updated', (data: any) => {
      if (data.status === 'arrived') setTripPhase('arrived');
      else if (data.status === 'active') setTripPhase('in_progress');
      else if (data.status === 'completed') {
        setTripPhase('completed');
        setTripStatus('completed');
        navigation.navigate('TripComplete');
      }
    });

    // 🔴 REAL: Receive live driver GPS position
    socket.on('driver:position', (data: { lat: number; lng: number }) => {
      setDriverPos({ lat: data.lat, lng: data.lng });
      if (pickupZone) {
        const pickupLat = 15.5007;
        const pickupLng = 32.5599;
        const distKm = haversineKm(data.lat, data.lng, pickupLat, pickupLng);
        const eta = Math.ceil((distKm / 30) * 60);
        setEtaMinutes(eta);
      }
    });

    return () => {
      socket.off('trip:status_updated');
      socket.off('driver:position');
    };
  }, [currentTrip?._id]);

  // Start trip elapsed timer when phase becomes in_progress
  useEffect(() => {
    if (tripPhase === 'in_progress') {
      if (!tripStartedAt.current) {
        tripStartedAt.current = Date.now();
      }
      const timer = setInterval(() => {
        setTripElapsedSec(Math.floor((Date.now() - (tripStartedAt.current || Date.now())) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
    if (tripPhase === 'completed') {
      clearInterval(0);
    }
  }, [tripPhase]);

  const getStatusLabel = () => {
    switch (tripPhase) {
      case 'en_route_pickup': return isRTL ? 'الكابتن في الطريق إليك' : t('driver_arriving');
      case 'arrived': return isRTL ? 'الكابتن وصل' : t('arrived_pickup');
      case 'in_progress': return isRTL ? 'في الطريق' : t('en_route');
      case 'completed': return isRTL ? 'وصلت بسلامة' : t('trip_complete');
      default: return isRTL ? 'الكابتن قادم' : t('driver_arriving');
    }
  };

  const getPhaseIndex = () => {
    switch (tripPhase) {
      case 'en_route_pickup': return 0;
      case 'arrived': return 1;
      case 'in_progress': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  // اتصال مباشر بالكابتن (الرقم الحقيقي)
  const handleCall = () => {
    const phone = assignedDriver?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert(isRTL ? 'غير متاح' : 'Unavailable', isRTL ? 'رقم الكابتن غير متوفر' : 'Driver number unavailable');
    }
  };

  const handleCancel = () => {
    Alert.alert(isRTL ? 'إلغاء الرحلة' : 'Cancel Trip', isRTL ? 'هل أنت متأكد من إلغاء الرحلة؟' : 'Are you sure?', [
      { text: isRTL ? 'لا' : 'No', style: 'cancel' },
      { text: isRTL ? 'نعم، ألغِ' : 'Yes', onPress: () => { resetTrip(); navigation.navigate('UserHome'); } }
    ]);
  };

  const handleShareTrip = async () => {
    try {
      const driverName = assignedDriver?.name || (isRTL ? 'الكابتن' : 'Your driver');
      const vehicle = assignedDriver?.vehicleDetails?.make ? `${assignedDriver.vehicleDetails.make} - ${assignedDriver.vehicleDetails.plateNumber}` : '';
      const trackingLink = `https://wedo.sd/track/${currentTrip?._id || 'mock123'}`;
      
      const message = isRTL 
        ? `أنا في رحلة مع ودّو 💚\nالسائق: ${driverName}\nالسيارة: ${vehicle}\n\nتتبع رحلتي مباشرة من هنا:\n${trackingLink}`
        : `I'm on a trip with Wedo 💚\nDriver: ${driverName}\nVehicle: ${vehicle}\n\nTrack my ride live here:\n${trackingLink}`;

      await Share.share({ message });
    } catch (e) {}
  };

  const handleComplaint = () => {
    const supportNumber = '+201157155248';
    Alert.alert(
      isRTL ? 'تقديم بلاغ' : 'Submit Report',
      isRTL 
        ? `سيتم الاتصال بفريق الدعم مباشرةً على الرقم:\n${supportNumber}`
        : `You will be connected to our support team at:\n${supportNumber}`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { 
          text: isRTL ? 'اتصال الآن' : 'Call Now', 
          onPress: () => Linking.openURL(`tel:${supportNumber}`) 
        },
      ]
    );
  };
  
  const submitSafetyReport = (reason: string) => {
    setShowSafetyModal(false);
    Alert.alert(isRTL ? 'تم استلام بلاغك' : 'Report Received', isRTL ? `سيتابع فريق الدعم حالة: ${reason}` : `Our support will follow up on: ${reason}`);
  };

  const handleAddStopAtRide = () => {
     addStop({ _id: 'new_stop', name: 'New Stop', nameAr: 'وقفة جديدة' });
  };

  const phaseIndex = getPhaseIndex();
  const driverDisplayName = assignedDriver?.name || (isRTL ? 'الكابتن' : 'Captain');
  const vehicleMake = assignedDriver?.vehicleDetails?.make || 'Toyota';
  const vehicleModel = assignedDriver?.vehicleDetails?.model || 'Camry';
  const plateNumber = assignedDriver?.vehicleDetails?.plateNumber || 'M3-294';

  return (
    <View style={styles.container}>
      {/* Map Area */}
      <View style={styles.mapBg}>
          <MapView style={styles.map} customMapStyle={SILVER_MAP_STYLE}>
            {/* Route Line */}
            <Polyline strokeColor={COLORS.primary} strokeWidth={4} />

            {/* Pickup Dot */}
            <Marker style={{ top: 100, left: 300 }}>
              <View style={styles.pickupMarkerDot}>
                <View style={styles.pickupMarkerInner} />
              </View>
            </Marker>

            {/* Dropoff Destination Pin */}
            <Marker style={{ top: 80, left: 285 }}>
              <View style={styles.dropoffFlag}>
                <MapPin color="#fff" size={12} />
              </View>
            </Marker>

            {/* Driver Car marker */}
            <Marker style={{ top: 340, left: 115 }}>
              <View style={styles.carMarkerBox}>
                <Car color="#fff" size={14} />
              </View>
            </Marker>
          </MapView>
      </View>

      {/* Floating back button */}
      <TouchableOpacity 
        style={styles.floatingBackBtn}
        onPress={handleCancel}
        activeOpacity={0.85}
      >
        <ChevronLeft size={22} color="#1C1C1E" />
      </TouchableOpacity>

      {/* Demo Skip Button */}
      <TouchableOpacity 
        style={styles.demoSkipBtn}
        onPress={() => {
          if (tripPhase === 'en_route_pickup') { setTripPhase('arrived'); }
          else if (tripPhase === 'arrived') { setTripPhase('in_progress'); }
          else if (tripPhase === 'in_progress') { 
            setTripPhase('completed'); 
            setTripStatus('completed');
            navigation.navigate('TripComplete'); 
          }
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.demoSkipText}>{isRTL ? 'تخطي' : 'Skip'}</Text>
      </TouchableOpacity>

      {/* Status Progress Bar */}
      <View style={styles.progressBar}>
        <View style={styles.progressTrack}>
          {[0, 1, 2].map((step) => (
            <React.Fragment key={step}>
              <View style={[styles.progressDot, phaseIndex >= step && styles.progressDotActive]}>
                <Text style={[styles.progressDotText, phaseIndex >= step && styles.progressDotTextActive]}>{step + 1}</Text>
              </View>
              {step < 2 && (
                <View style={[styles.progressLine, phaseIndex > step && styles.progressLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.statusPill}>
          <View style={[styles.statusPulse, { backgroundColor: tripPhase === 'in_progress' ? COLORS.success : COLORS.primary }]} />
          <Text style={styles.statusPillText}>{getStatusLabel()}</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <SwipeableBottomSheet snapPoints={[480, 120]} initialSnapIndex={0} style={{ padding: 0 }}>
        <View style={styles.sheetContent}>

          {/* Driver Info Card */}
          <View style={[styles.driverCard, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>
                {driverDisplayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={[styles.driverName, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                {driverDisplayName}
              </Text>
              <Text style={[styles.vehicleInfo, isRTL && { textAlign: 'right' }]}>
                {vehicleMake} {vehicleModel}
              </Text>
            </View>
            <View style={[styles.driverMeta, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.ratingPill}>
                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingValue}>4.9</Text>
              </View>
              <View style={styles.platePill}>
                <Text style={styles.plateText}>{plateNumber}</Text>
              </View>
            </View>
          </View>

          {/* Info Grid */}
          <View style={[styles.infoGrid, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.infoBox}>
              <Clock size={20} color={COLORS.primary} />
              <Text style={styles.infoValue}>{etaMinutes || 5} {isRTL ? 'د' : 'min'}</Text>
              <Text style={styles.infoLabel}>{isRTL ? 'الوصول' : 'ETA'}</Text>
            </View>
            <View style={styles.infoBox}>
              <MapPin size={20} color={COLORS.primary} />
              <Text style={styles.infoValue} numberOfLines={1}>~5 {isRTL ? 'كم' : 'km'}</Text>
              <Text style={styles.infoLabel}>{isRTL ? 'المسافة' : 'Distance'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Navigation size={20} color={COLORS.primary} />
              <Text style={styles.infoValue}>{t('sdg')} {fareEstimate.toLocaleString()}</Text>
              <Text style={styles.infoLabel}>{isRTL ? 'الأجرة' : 'Fare'}</Text>
            </View>
          </View>

          {/* Route Info */}
          <View style={styles.routeCard}>
            <View style={[styles.routeRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.routeIndicator}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
                <View style={styles.routeLineV} />
                <View style={[styles.routeDot, { backgroundColor: '#F59E0B' }]} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={[styles.routeLabel, isRTL && { textAlign: 'right' }]}>{isRTL ? 'من' : 'From'}</Text>
                  <Text style={[styles.routeZone, isRTL && { textAlign: 'right' }]} numberOfLines={1}>{getZoneLabel(pickupZone) || (isRTL ? 'نقطة البداية' : 'Pickup Point')}</Text>
                </View>
                <View>
                  <Text style={[styles.routeLabel, isRTL && { textAlign: 'right' }]}>{isRTL ? 'إلى' : 'To'}</Text>
                  <Text style={[styles.routeZone, isRTL && { textAlign: 'right' }]} numberOfLines={1}>{getZoneLabel(dropoffZone) || (isRTL ? 'الوجهة' : 'Destination')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.actionRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.8}>
              <View style={[styles.actionIcon, { backgroundColor: '#EBF4FF' }]}>
                <Phone size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>{isRTL ? 'اتصال' : 'Call'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShareTrip} activeOpacity={0.8}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Share2 size={18} color={COLORS.success} />
              </View>
              <Text style={styles.actionText}>{isRTL ? 'مشاركة' : 'Share'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowSafetyModal(true)} activeOpacity={0.8}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <ShieldAlert size={18} color={COLORS.error} />
              </View>
              <Text style={styles.actionText}>{isRTL ? 'أمان' : 'Safety'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleComplaint} activeOpacity={0.8}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFFBEB' }]}>
                <AlertCircle size={18} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>{isRTL ? 'بلاغ' : 'Report'}</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel Request (subtle) */}
          {tripPhase !== 'in_progress' && (
            <TouchableOpacity style={styles.cancelTxtBtn} onPress={handleCancel}>
              <Text style={styles.cancelTxtBtnText}>{t('cancel_request') || 'إلغاء الطلب'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SwipeableBottomSheet>

      {/* Safety Report */}
      <CustomAlert
        visible={showSafetyModal}
        type="error"
        emoji="🚨"
        title={isRTL ? 'مركز الأمان والطوارئ' : 'Safety & SOS Center'}
        message={isRTL ? 'اختر سبب البلاغ لإرساله لفريق الدعم' : 'Select the reason for your report'}
        buttons={[
          {
            text: isRTL ? 'القيادة بتهور' : 'Reckless Driving',
            style: 'destructive',
            onPress: () => submitSafetyReport(isRTL ? 'القيادة بتهور' : 'Reckless Driving'),
          },
          {
            text: isRTL ? 'سيارة خاطئة' : 'Wrong Vehicle',
            style: 'destructive',
            onPress: () => submitSafetyReport(isRTL ? 'سيارة خاطئة' : 'Wrong Vehicle'),
          },
          {
            text: isRTL ? 'إلغاء' : 'Cancel',
            style: 'cancel',
            onPress: () => setShowSafetyModal(false),
          },
        ]}
        onDismiss={() => setShowSafetyModal(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  mapBg: { flex: 1 },
  map: { width: '100%', height: '100%' },

  // Top Buttons
  floatingBackBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    ...SHADOWS.md,
  },
  demoSkipBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    zIndex: 20,
    ...SHADOWS.md,
  },
  demoSkipText: { color: '#1C1C1E', fontWeight: '800', fontSize: 13 },

  // Progress Bar
  progressBar: {
    position: 'absolute',
    top: 106,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    zIndex: 10,
    ...SHADOWS.md,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  progressDotTextActive: {
    color: '#fff',
  },
  progressLine: {
    height: 3,
    width: 60,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },

  // Sheet Content
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  // Driver Card
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  driverAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  vehicleInfo: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  driverMeta: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  platePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  plateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },

  // Route Card
  routeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  routeIndicator: {
    alignItems: 'center',
    marginRight: 14,
    paddingVertical: 2,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLineV: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  routeLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeZone: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // Cancel
  cancelTxtBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  cancelTxtBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 14,
  },

  // Map Markers
  pickupMarkerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(24,119,242,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  pickupMarkerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  dropoffFlag: {
    backgroundColor: '#F59E0B',
    padding: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  carMarkerBox: {
    backgroundColor: COLORS.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 5,
  },
});
