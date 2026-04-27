import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Alert, Platform, Linking } from 'react-native';
import { MapPin, Phone, X, Navigation, ChevronLeft, Car, Clock, Star } from 'lucide-react-native';
import CustomAlert from '../../components/CustomAlert';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
import { SafeMapView as MapView, SafeMarker as Marker } from '../../components/MapViewMock';
import { SILVER_MAP_STYLE } from '../../constants/mapStyle';


export default function SearchingScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { pickupZone, dropoffZone, fareEstimate, vehicleType, setTripStatus, setAssignedDriver, setCurrentTrip, resetTrip } = useTripStore();
  
  const [phase, setPhase] = useState<'searching' | 'assigned'>('searching');
  const [assignedDriverData, setAssignedDriverData] = useState<any>(null);
  const [showCancelOptions, setShowCancelOptions] = useState(false);
  
  // Animations
  const pulseAnim1 = useRef(new Animated.Value(0.6)).current;
  const pulseAnim2 = useRef(new Animated.Value(0.4)).current;
  const pulseAnim3 = useRef(new Animated.Value(0.2)).current;
  const slideAnim = useRef(new Animated.Value(400)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Multi-ring pulse animation
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: delay === 0 ? 0.6 : delay === 300 ? 0.4 : 0.2, duration: 400, useNativeDriver: true }),
        ])
      );

    const p1 = createPulse(pulseAnim1, 0);
    const p2 = createPulse(pulseAnim2, 300);
    const p3 = createPulse(pulseAnim3, 600);
    p1.start(); p2.start(); p3.start();

    // Searching dot animation
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 3, duration: 1200, useNativeDriver: false }),
        Animated.timing(dotAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    dotLoop.start();

    const requestTrip = async () => {
      const { isServerEnabled } = useAuthStore.getState();
      
      if (!isServerEnabled) {
        const mockTimer = setTimeout(() => {
          const mockDriver = {
            _id: 'mock_driver_99',
            name: 'Ahmed Captain',
            nameAr: 'أحمد الكابتن',
            phone: '0912345678',
            reliabilityScore: 4.8,
            vehicleDetails: { make: 'Hyundai', model: 'Accent', plateNumber: 'خ ٤ - ١٢٣٤' }
          };
          handleDriverAssigned(mockDriver);
        }, 3000);
        return;
      }

      try {
        const response = await api.post('/trip/request', {
          pickupZoneId: pickupZone?._id,
          dropoffZoneId: dropoffZone?._id,
          vehicleType: vehicleType,
        });
        const { trip } = response.data;
        setCurrentTrip(trip);
      } catch (error: any) {
        console.log('[Wedo] Server trip request failed, switching to mock mode');
        setTimeout(() => {
          const mockDriver = {
            _id: 'mock_driver_fallback',
            name: 'Ahmed Captain',
            nameAr: 'أحمد الكابتن',
            phone: '0912345678',
            reliabilityScore: 4.7,
            vehicleDetails: { make: 'Toyota', model: 'Camry', plateNumber: 'ك م ٢ - ٤٥٦٧' }
          };
          handleDriverAssigned(mockDriver);
        }, 3000);
      }
    };

    requestTrip();

    const socket = getSocket();
    if (socket) {
      socket.on('trip:driver_responded', (data: any) => { if (data.response === 'accepted') handleDriverAssigned(data); });
    }

    return () => {
      p1.stop(); p2.stop(); p3.stop(); dotLoop.stop();
      if (socket) socket.off('trip:driver_responded');
    };
  }, []);

  const handleDriverAssigned = (driverData: any) => {
    setAssignedDriverData(driverData);
    setAssignedDriver(driverData);
    setTripStatus('assigned');
    setPhase('assigned');
    Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }).start();
  };

  const [showApology, setShowApology] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleTryAgain = () => {
    setShowApology(false);
    setPhase('searching');
    setTimeout(() => {
      const mockDriver = {
        _id: 'mock_driver_retry',
        name: 'Mohammed Captain',
        nameAr: 'محمد الكابتن',
        phone: '0987654321',
        reliabilityScore: 4.9,
        vehicleDetails: { make: 'Toyota', model: 'Corolla', plateNumber: 'ب ١ - ٨٨٨٨' }
      };
      handleDriverAssigned(mockDriver);
    }, 3000);
  };

  const confirmCancel = (reason: string) => {
    setShowCancelOptions(false);
    if (reason === 'ابحث عن سائق آخر' || reason === 'Search for another driver') {
      setPhase('searching');
      handleTryAgain();
      return;
    }
    setCancelReason(reason);
    setShowApology(true);
  };

  const handleGoHome = () => {
    setShowApology(false);
    resetTrip();
    navigation.goBack();
  };

  const getZoneLabel = (zone: any) => isRTL ? zone?.nameAr : zone?.name;

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapBg}>
        {MapView ? (
          <MapView 
            style={styles.map} 
            customMapStyle={SILVER_MAP_STYLE}
            initialRegion={{ latitude: 15.5007, longitude: 32.5599, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
          >
            <Marker coordinate={{ latitude: 15.5007, longitude: 32.5599 }}>
              <View style={styles.userMarker}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder} />
        )}
      </View>

      {/* Top Bar */}
      <View style={[styles.topBar, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => { resetTrip(); navigation.goBack(); }}
          activeOpacity={0.8}
        >
          <ChevronLeft size={22} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={styles.brandPill}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>Wedo</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Searching Phase */}
      {phase === 'searching' && (
        <View style={styles.bottomSheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Animated Radar */}
          <View style={styles.radarContainer}>
            <Animated.View style={[styles.radarRing, styles.radarRing3, { opacity: pulseAnim3, transform: [{ scale: pulseAnim3.interpolate({ inputRange: [0.2, 1], outputRange: [1, 1.8] }) }] }]} />
            <Animated.View style={[styles.radarRing, styles.radarRing2, { opacity: pulseAnim2, transform: [{ scale: pulseAnim2.interpolate({ inputRange: [0.4, 1], outputRange: [1, 1.4] }) }] }]} />
            <Animated.View style={[styles.radarRing, styles.radarRing1, { opacity: pulseAnim1, transform: [{ scale: pulseAnim1.interpolate({ inputRange: [0.6, 1], outputRange: [1, 1.15] }) }] }]} />
            <View style={styles.radarCenter}>
              <Car color="#fff" size={22} />
            </View>
          </View>

          <Text style={[styles.searchTitle, isRTL && { textAlign: 'right' }]}>
            {isRTL ? 'جاري البحث عن أقرب كابتن...' : 'Finding your captain...'}
          </Text>
          <Text style={[styles.searchSub, isRTL && { textAlign: 'right' }]}>
            {isRTL ? 'سيتم تعيين كابتن لك في لحظات' : 'A captain will be assigned shortly'}
          </Text>

          {/* Trip Summary Mini */}
          <View style={[styles.tripSummaryRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.tripSummaryItem}>
              <View style={[styles.tripSummaryDot, { backgroundColor: COLORS.primary }]} />
              <Text style={[styles.tripSummaryText, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                {getZoneLabel(pickupZone) || (isRTL ? 'نقطة البداية' : 'Pickup')}
              </Text>
            </View>
            <View style={styles.tripSummaryArrow}>
              <Navigation size={14} color={COLORS.onSurfaceVariant} />
            </View>
            <View style={styles.tripSummaryItem}>
              <View style={[styles.tripSummaryDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.tripSummaryText, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                {getZoneLabel(dropoffZone) || (isRTL ? 'الوجهة' : 'Drop-off')}
              </Text>
            </View>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>{isRTL ? 'الأجرة المتوقعة' : 'Est. Fare'}</Text>
            <Text style={styles.fareValue}>{t('sdg')} {fareEstimate.toLocaleString()}</Text>
          </View>

          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => setShowCancelOptions(true)}
            activeOpacity={0.8}
          >
            <X size={16} color={COLORS.error} />
            <Text style={styles.cancelBtnText}>{isRTL ? 'إلغاء الطلب' : 'Cancel Request'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Assigned Phase */}
      {phase === 'assigned' && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Assigned Header */}
          <View style={[styles.assignedHeader, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.assignedIconWrap}>
              <Car color={COLORS.primary} size={20} />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={[styles.assignedBadge, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'تم تعيين الكابتن ✓' : 'Captain Assigned ✓'}
              </Text>
              <Text style={[styles.assignedETA, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'الكابتن في طريقه إليك' : 'Your captain is on the way'}
              </Text>
            </View>
            <View style={styles.etaBubble}>
              <Clock size={12} color={COLORS.primary} />
              <Text style={styles.etaText}>~5 {isRTL ? 'د' : 'm'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Driver Info */}
          <View style={[styles.driverRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.driverAvatarWrap}>
              <Text style={styles.driverAvatarText}>
                {(isRTL ? (assignedDriverData?.nameAr || assignedDriverData?.name) : assignedDriverData?.name)?.charAt(0)?.toUpperCase() || 'K'}
              </Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={[styles.driverName, isRTL && { textAlign: 'right' }]}>
                {isRTL ? 'الكابتن ' : 'Captain '}
                {isRTL ? (assignedDriverData?.nameAr || assignedDriverData?.name) : assignedDriverData?.name}
              </Text>
              <View style={[styles.driverMetaRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <Text style={styles.driverMeta}>
                  {assignedDriverData?.vehicleDetails?.make} {assignedDriverData?.vehicleDetails?.model}
                </Text>
                <View style={styles.dot} />
                <Text style={styles.driverMeta}>
                  {assignedDriverData?.vehicleDetails?.plateNumber}
                </Text>
              </View>
            </View>
            <View style={[styles.driverActions, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.ratingBadge}>
                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{assignedDriverData?.reliabilityScore || '4.8'}</Text>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => {
                  const phone = assignedDriverData?.phone;
                  if (phone) Linking.openURL(`tel:${phone}`);
                }}
                activeOpacity={0.8}
              >
                <Phone size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Track Button */}
          <TouchableOpacity 
            style={styles.trackBtn} 
            onPress={() => navigation.navigate('TripStatus')}
            activeOpacity={0.85}
          >
            <Navigation size={18} color="#fff" />
            <Text style={styles.trackBtnText}>{isRTL ? 'تتبع الرحلة' : 'Track Your Trip'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelTxtBtn}
            onPress={() => setShowCancelOptions(true)}
          >
            <Text style={styles.cancelTxtText}>{isRTL ? 'إلغاء الطلب' : 'Cancel Request'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Cancel Options Sheet */}
      {showCancelOptions && (
        <View style={styles.cancelOverlay}>
          <TouchableOpacity style={styles.cancelOverlayBg} onPress={() => setShowCancelOptions(false)} activeOpacity={1} />
          <View style={styles.cancelSheet}>
            <View style={styles.dragHandle} />
            <Text style={[styles.cancelSheetTitle, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'لماذا تريد الإلغاء؟' : 'Why are you cancelling?'}
            </Text>
            <Text style={[styles.cancelSheetSub, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'ساعدنا نحسن الخدمة بمعرفة السبب' : 'Help us improve by telling us why'}
            </Text>
            {[
              { ar: 'ابحث عن سائق آخر', en: 'Search for another driver' },
              { ar: 'السائق تأخر كتير', en: 'Driver is taking too long' },
              { ar: 'غيرت رأيي', en: 'Changed my mind' },
              { ar: 'لقيت وسيلة ثانية', en: 'Found another ride' },
              { ar: 'حجزت غلط', en: 'Booked by mistake' },
            ].map((r, i) => (
              <TouchableOpacity key={i} style={[styles.reasonItem, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => confirmCancel(isRTL ? r.ar : r.en)} activeOpacity={0.7}>
                <Text style={[styles.reasonText, isRTL && { textAlign: 'right' }]}>{isRTL ? r.ar : r.en}</Text>
                <ChevronLeft size={18} color="#ccc" style={isRTL ? {} : { transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.keepWaitingBtn} onPress={() => setShowCancelOptions(false)} activeOpacity={0.8}>
              <Text style={styles.keepWaitingText}>{isRTL ? 'لا، سأنتظر' : "No, I'll wait"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Apology Alert */}
      <CustomAlert
        visible={showApology}
        type="warning"
        emoji="😔"
        title={isRTL ? 'نعتذر منك!' : 'We Apologize!'}
        message={
          (isRTL
            ? 'نأسف أن التجربة لم تكن كما تتوقع.\nسبب: '
            : "We're sorry! Reason: ")
          + cancelReason
        }
        buttons={[
          {
            text: isRTL ? 'العودة للرئيسية' : 'Go Home',
            style: 'cancel',
            onPress: handleGoHome,
          },
          {
            text: isRTL ? 'حاول مرة أخرى' : 'Try Again',
            style: 'default',
            onPress: handleTryAgain,
          },
        ]}
        onDismiss={handleGoHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  mapBg: { flex: 1 },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: { flex: 1, backgroundColor: '#E2E8F0' },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    ...SHADOWS.md,
  },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  brandText: { fontSize: 16, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    ...SHADOWS.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  // Radar
  radarContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  radarRing1: { width: 60, height: 60 },
  radarRing2: { width: 80, height: 80 },
  radarRing3: { width: 100, height: 100 },
  radarCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },

  searchTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  searchSub: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },

  // Trip Summary
  tripSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tripSummaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripSummaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  tripSummaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  tripSummaryArrow: {
    paddingHorizontal: 4,
  },

  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  fareLabel: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },

  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.error,
  },

  // Assigned
  assignedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  assignedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  assignedBadge: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.2,
  },
  assignedETA: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 2,
  },
  etaBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    ...SHADOWS.sm,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },

  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  driverAvatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  driverName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  driverMeta: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.onSurfaceVariant,
  },
  driverActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },

  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...SHADOWS.md,
  },
  trackBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fff',
  },

  cancelTxtBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelTxtText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '700',
  },

  // Cancel Sheet
  cancelOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 200 },
  cancelOverlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  cancelSheet: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cancelSheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1C1E',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cancelSheetSub: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: 20,
    fontWeight: '500',
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reasonText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    fontWeight: '600',
  },
  keepWaitingBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  keepWaitingText: {
    fontWeight: '800',
    color: '#fff',
    fontSize: 15,
  },

  // User Marker
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(24,119,242,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
