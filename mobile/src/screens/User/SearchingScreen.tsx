import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, Alert, Platform, Linking } from 'react-native';
import { Target, Phone, X, Bell, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
import { SafeMapView as MapView, SafeMarker as Marker } from '../../components/MapViewMock';
import { DARK_MAP_STYLE } from '../../constants/mapStyle';


export default function SearchingScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { pickupZone, dropoffZone, fareEstimate, vehicleType, setTripStatus, setAssignedDriver, setCurrentTrip, resetTrip } = useTripStore();
  
  const [phase, setPhase] = useState<'searching' | 'assigned'>('searching');
  const [assignedDriverData, setAssignedDriverData] = useState<any>(null);
  const [showCancelOptions, setShowCancelOptions] = useState(false);
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

    const requestTrip = async () => {
      const { isServerEnabled } = useAuthStore.getState();
      
      if (!isServerEnabled) {
        setTimeout(() => {
          const mockDriver = {
            _id: 'mock_driver_99',
            name: 'Ahmed Captain',
            nameAr: 'علي السائق',
            phone: '0912345678',
            reliabilityScore: 4.8,
            vehicleDetails: { make: 'Hyundai', model: 'Accent', plateNumber: 'خ ٤ - ١٢٣٤' }
          };
          handleDriverAssigned(mockDriver);
        }, 4000);
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
        Alert.alert(t('error'), isRTL ? 'فشل الطلب' : 'Request failed', [{ text: 'OK', onPress: () => { resetTrip(); navigation.goBack(); } }]);
      }
    };

    requestTrip();

    const socket = getSocket();
    if (socket) {
      socket.on('trip:driver_responded', (data: any) => { if (data.response === 'accepted') handleDriverAssigned(data); });
    }

    return () => {
      pulse.stop();
      if (socket) socket.off('trip:driver_responded');
    };
  }, []);

  const handleDriverAssigned = (driverData: any) => {
    setAssignedDriverData(driverData);
    setAssignedDriver(driverData);
    setTripStatus('assigned');
    setPhase('assigned');
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  };

  const [showApology, setShowApology] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const confirmCancel = (reason: string) => {
    setCancelReason(reason);
    setShowCancelOptions(false);
    setShowApology(true);
  };

  const handleTryAgain = () => {
    setShowApology(false);
    setPhase('searching');
    // Re-trigger the search
    const { isServerEnabled } = useAuthStore.getState();
    if (!isServerEnabled) {
      setTimeout(() => {
        const mockDriver = {
          _id: 'mock_driver_99',
          name: 'Ahmed Captain',
          nameAr: 'أحمد الكابتن',
          phone: '0912345678',
          reliabilityScore: 4.8,
          vehicleDetails: { make: 'Hyundai', model: 'Accent', plateNumber: 'خ ٤ - ١٢٣٤' }
        };
        handleDriverAssigned(mockDriver);
      }, 4000);
    }
  };

  const handleGoHome = () => {
    setShowApology(false);
    resetTrip();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapBg}>
        {MapView ? (
          <MapView 
            style={styles.map} 
            customMapStyle={DARK_MAP_STYLE}
            initialRegion={{ latitude: 15.5007, longitude: 32.5599, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
          >
            <Marker coordinate={{ latitude: 15.5007, longitude: 32.5599 }}>
               <View style={styles.userMarker} />
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder} />
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.brandText}>Wedo</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} /><Text style={styles.onlineText}>{t('online')}</Text>
        </View>
      </View>

      {phase === 'searching' && (
        <View style={styles.searchCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.searchTitle}>{isRTL ? 'جاري البحث عن سائق...' : t('finding_ride')}</Text>
              <Text style={styles.searchSub}>{isRTL ? 'يتم البحث عن أقرب كابتن لك' : t('matching_driver')}</Text>
            </View>
            <Animated.View style={[styles.pulseCircle, { opacity: pulseAnim }]}><Target color={COLORS.primary} size={28} /></Animated.View>
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCancelOptions(true)}>
            <Text style={styles.cancelBtnText}>{isRTL ? 'إلغاء الطلب' : t('cancel_request')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'assigned' && (
        <Animated.View style={[styles.assignedContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.driverCard}>
            <Text style={styles.assignedLabel}>{isRTL ? 'تم تعيين الكابتن! 🟢' : 'CAPTAIN ASSIGNED! 🟢'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <View style={styles.driverAvatar}><Text style={{ color: '#fff', fontWeight: 'bold' }}>K</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.driverName}>
                  {isRTL ? 'الكابتن ' : 'Captain '}
                  {isRTL ? (assignedDriverData?.nameAr || assignedDriverData?.name) : assignedDriverData?.name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{assignedDriverData?.vehicleDetails?.make} • {assignedDriverData?.vehicleDetails?.plateNumber}</Text>
              </View>
              {/* زر اتصال مباشر */}
              <TouchableOpacity
                style={styles.callIconBtn}
                onPress={() => {
                  const phone = assignedDriverData?.phone;
                  if (phone) Linking.openURL(`tel:${phone}`);
                }}
              >
                <Phone size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('TripStatus')}>
               <Text style={styles.trackBtnText}>{isRTL ? 'تتبع الرحلة' : 'Track Trip'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {showCancelOptions && (
        <View style={styles.cancelOverlay}>
          <TouchableOpacity style={styles.cancelOverlayBg} onPress={() => setShowCancelOptions(false)} activeOpacity={1} />
          <View style={styles.cancelSheet}>
            <View style={styles.cancelHandle} />
            <Text style={[styles.cancelSheetTitle, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'لماذا تريد الإلغاء؟' : 'Why are you cancelling?'}
            </Text>
            <Text style={[styles.cancelSheetSub, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'ساعدنا نحسن الخدمة بمعرفة السبب' : 'Help us improve by telling us why'}
            </Text>
            {[
              { ar: 'السائق تأخر كتير', en: 'Driver is taking too long' },
              { ar: 'غيرت رأيي', en: 'Changed my mind' },
              { ar: 'لقيت وسيلة ثانية', en: 'Found another ride' },
              { ar: 'حجزت غلط', en: 'Booked by mistake' },
            ].map((r, i) => (
              <TouchableOpacity key={i} style={styles.reasonItem} onPress={() => confirmCancel(isRTL ? r.ar : r.en)} activeOpacity={0.7}>
                <Text style={[styles.reasonText, isRTL && { textAlign: 'right' }]}>{isRTL ? r.ar : r.en}</Text>
                <View style={styles.reasonArrow}>
                  <Text style={{ color: '#ccc', fontSize: 16 }}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.keepWaitingBtn} onPress={() => setShowCancelOptions(false)} activeOpacity={0.8}>
              <Text style={styles.keepWaitingText}>{isRTL ? 'لا، سأنتظر' : "No, I'll wait"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Apology Screen after Cancellation */}
      {showApology && (
        <View style={styles.apologyOverlay}>
          <View style={styles.apologyCard}>
            <Text style={styles.apologyEmoji}>😔</Text>
            <Text style={styles.apologyTitle}>
              {isRTL ? 'نعتذر منك!' : 'We apologize!'}
            </Text>
            <Text style={styles.apologyMsg}>
              {isRTL 
                ? 'نأسف أن التجربة لم تكن كما تتوقع. نعمل دائماً على تحسين الخدمة لك.'
                : "We're sorry this experience wasn't what you expected. We're always working to improve."}
            </Text>
            <View style={styles.apologyReasonBox}>
              <Text style={styles.apologyReasonLabel}>{isRTL ? 'سبب الإلغاء:' : 'Reason:'}</Text>
              <Text style={styles.apologyReasonText}>{cancelReason}</Text>
            </View>
            <TouchableOpacity style={styles.tryAgainBtn} onPress={handleTryAgain} activeOpacity={0.85}>
              <Text style={styles.tryAgainText}>{isRTL ? 'حاول مرة أخرى' : 'Try Again'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.goHomeBtn} onPress={handleGoHome} activeOpacity={0.8}>
              <Text style={styles.goHomeText}>{isRTL ? 'العودة للرئيسية' : 'Go Home'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8d5b8' },
  mapBg: { flex: 1 },
  map: { width: '100%', height: '100%' },
  mapPlaceholder: { flex: 1, backgroundColor: '#e8d5b8' },
  header: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandText: { fontSize: 24, fontWeight: 'bold' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 20 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 6 },
  onlineText: { fontSize: 12, fontWeight: 'bold' },
  searchCard: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, ...SHADOWS.lg },
  searchTitle: { fontSize: 22, fontWeight: '900', color: '#000000', marginBottom: 4 },
  searchSub: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  pulseCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#1C1C1E', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  cancelBtnText: { fontWeight: 'bold', color: '#FFFFFF' },
  assignedContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  driverCard: { backgroundColor: COLORS.primary, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  assignedLabel: { color: 'rgba(255,255,255,0.8)', fontWeight: 'bold', fontSize: 12 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  driverName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  callIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  trackBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  trackBtnText: { color: COLORS.primary, fontWeight: 'bold' },
  cancelOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 100 },
  cancelOverlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  cancelSheet: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  cancelHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e5e5e5', alignSelf: 'center', marginBottom: 20 },
  cancelSheetTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: '#1f2937' },
  cancelSheetSub: { fontSize: 13, color: '#9ca3af', marginBottom: 20 },
  reasonItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  reasonText: { fontSize: 15, color: '#374151', flex: 1 },
  reasonArrow: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  keepWaitingBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  keepWaitingText: { fontWeight: 'bold', color: '#fff', fontSize: 15 },
  userMarker: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#fff' },
  // Apology styles
  apologyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 200, padding: 24 },
  apologyCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 340, ...SHADOWS.lg },
  apologyEmoji: { fontSize: 48, marginBottom: 12 },
  apologyTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  apologyMsg: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  apologyReasonBox: { backgroundColor: '#f9fafb', padding: 12, borderRadius: 12, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#f3f4f6' },
  apologyReasonLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 4 },
  apologyReasonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  tryAgainBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  tryAgainText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  goHomeBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  goHomeText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
});
