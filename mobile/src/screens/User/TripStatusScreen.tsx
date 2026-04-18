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
import { DARK_MAP_STYLE } from '../../constants/mapStyle';
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

  return (
    <View style={styles.container}>
      <View style={styles.mapBg}>
          <MapView style={styles.map} customMapStyle={DARK_MAP_STYLE}>
            {/* Route Line */}
            <Polyline strokeColor="#1a1a1a" strokeWidth={5} />

            {/* Pickup Dot — clean, no text */}
            <Marker style={{ top: 100, left: 300 }}>
              <View style={styles.pickupMarkerDot}>
                <View style={styles.pickupMarkerInner} />
              </View>
            </Marker>

            {/* Dropoff Destination Pin */}
            <Marker style={{ top: 80, left: 285 }}>
              <View style={styles.dropoffFlag}>
                <Navigation color="#fff" size={13} />
              </View>
            </Marker>

            {/* Driver Car marker — clean icon only, no text on map */}
            <Marker style={{ top: 340, left: 115 }}>
              <View style={styles.carMarkerBox}>
                <Car color="#fff" size={16} />
              </View>
            </Marker>
          </MapView>
      </View>

      {/* Floating back button - always visible */}
      <TouchableOpacity 
        style={styles.floatingBackBtn}
        onPress={handleCancel}
        activeOpacity={0.85}
      >
        <ChevronLeft size={24} color="#fff" />
      </TouchableOpacity>

      {/* Trip Timeline Progress */}
      {(tripPhase === 'en_route_pickup' || tripPhase === 'arrived') && (
        <View style={styles.timelineBar}>
          <View style={styles.timelineSteps}>
            {/* Step 1: Start */}
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.timelineDotText}>1</Text>
              </View>
              <Text style={[styles.timelineLabel, { color: COLORS.primary, fontWeight: 'bold' }]}>{isRTL ? 'بداية' : 'Start'}</Text>
            </View>

            <View style={[styles.timelineLine, { backgroundColor: tripPhase === 'en_route_pickup' ? '#e5e5e5' : COLORS.primary }]} />

            {/* Step 2: Captain Arrived */}
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, { backgroundColor: tripPhase === 'arrived' ? COLORS.primary : '#ccc' }]}>
                <Text style={styles.timelineDotText}>2</Text>
              </View>
              <Text style={[styles.timelineLabel, { color: tripPhase === 'arrived' ? COLORS.primary : '#999' }]}>
                {isRTL ? 'وصل' : 'Arrived'}
              </Text>
            </View>
          </View>

          {/* Status Pill */}
          <View style={[styles.statusPill, { backgroundColor: tripPhase === 'arrived' ? COLORS.primaryLight : '#e3f2fd' }]}>
            <View style={[styles.statusPulse, { backgroundColor: COLORS.primary }]} />
            <Text style={[styles.statusPillText, { color: COLORS.primary }]}>{getStatusLabel()}</Text>
          </View>
        </View>
      )}

      <SwipeableBottomSheet snapPoints={[540, 100]} initialSnapIndex={0} style={{ padding: 0 }}>
        <View style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 0 }}>
            {/* Top Dark Half */}
            <View style={styles.sheetTopDark}>
                <View style={[styles.sheetHeaderRow, isRTL && { flexDirection: 'row-reverse' }]}>
                   <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetMakeModel, isRTL && { textAlign: 'right' }]}>{assignedDriver?.vehicleDetails?.make || 'Toyota'} {assignedDriver?.vehicleDetails?.model || 'Camry'}</Text>
                      <View style={[styles.sheetSubInfo, isRTL && { flexDirection: 'row-reverse' }]}>
                         <Navigation size={12} color="#9CA3AF" style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }} />
                         <Text style={styles.sheetSubText}>{isRTL ? `> ~5 كم   ⛽ ${assignedDriver?.vehicleDetails?.plateNumber || 'M3-294'}` : `> ~5 km   ⛽ ${assignedDriver?.vehicleDetails?.plateNumber || 'M3-294'}`}</Text>
                      </View>
                   </View>
                   <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => navigation.navigate('UserHome')}>
                      <X size={16} color="#9CA3AF" />
                   </TouchableOpacity>
                </View>

                {/* Overlapping Car Image */}
                <Image 
                   source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png' }}
                   style={[styles.sheetCarImg, isRTL ? { left: -20, transform: [{ scaleX: -1 }] } : { right: -20 }]} 
                   resizeMode="contain" 
                />
            </View>

            {/* Bottom White Half */}
            <View style={styles.sheetBottomWhite}>
               <Text style={[styles.sheetSectionTitle, isRTL && { textAlign: 'right' }]}>{isRTL ? 'التفاصيل' : 'Features'}</Text>
               <View style={[styles.featuresGrid, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={styles.featureBox}>
                     <User size={26} color="#111" />
                     <Text style={styles.featureTitle} numberOfLines={1}>{assignedDriver?.name || 'Captain'}</Text>
                     <Text style={styles.featureSub}>{isRTL ? 'السائق' : 'Driver'}</Text>
                  </View>
                  <View style={styles.featureBox}>
                     <Star size={26} color="#111" fill="#111" />
                     <Text style={styles.featureTitle}>4.9</Text>
                     <Text style={styles.featureSub}>{isRTL ? 'التقييم' : 'Rating'}</Text>
                  </View>
                  <View style={styles.featureBox}>
                     <Clock size={26} color="#111" />
                     <Text style={styles.featureTitle}>{etaMinutes || 5} m</Text>
                     <Text style={styles.featureSub}>{isRTL ? 'الوصول' : 'ETA'}</Text>
                  </View>
               </View>

               <View style={[styles.sheetFooterRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                     <Text style={styles.sheetPrice}>${fareEstimate.toLocaleString()}</Text>
                     <Text style={styles.sheetPriceSub}>/{isRTL ? 'الرحلة' : 'trip'}</Text>
                  </View>
                  
                  {tripPhase === 'in_progress' ? (
                     <View style={[styles.sheetActionBtn, { backgroundColor: '#333' }]}>
                       <Text style={styles.sheetActionText}>{isRTL ? 'في الطريق' : 'In Progress'}</Text>
                     </View>
                  ) : (
                     <TouchableOpacity style={styles.sheetActionBtn} onPress={handleCall} activeOpacity={0.8}>
                        <Text style={styles.sheetActionText}>{isRTL ? 'اتصال' : 'Call Now'}</Text>
                     </TouchableOpacity>
                  )}
               </View>

               {/* Cancel Request (subtle) */}
               {tripPhase !== 'in_progress' && (
                  <TouchableOpacity style={styles.cancelTxtBtn} onPress={handleCancel}>
                      <Text style={styles.cancelTxtBtnText}>{t('cancel_request') || 'إلغاء الطلب'}</Text>
                  </TouchableOpacity>
               )}
            </View>
        </View>
      </SwipeableBottomSheet>

      {/* Safety Report — Premium CustomAlert */}
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
  container: { flex: 1, backgroundColor: '#000' },
  mapBg: { flex: 1 },
  map: { width: '100%', height: '100%' },
  mapGridPlaceholder: { flex: 1, backgroundColor: '#000' },

  floatingBackBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  timelineBar: { position: 'absolute', top: 50, left: 72, right: 16, backgroundColor: '#1C1C1E', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#333', ...SHADOWS.md, zIndex: 10 },
  timelineSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  timelineStep: { alignItems: 'center', width: 70 },
  timelineDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  timelineDotText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  timelineLabel: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  timelineLine: { height: 3, flex: 1, borderRadius: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginTop: 12, alignSelf: 'center' },
  statusPulse: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusPillText: { fontSize: 13, fontWeight: 'bold', color: '#FFF' },

  routeCard: { backgroundColor: '#1C1C1E', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  fareInsideCard: { alignItems: 'center', paddingBottom: 12 },
  fareInsideLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '800', marginBottom: 2 },
  fareInsideValue: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  fareInsideCurrency: { fontSize: 16, fontWeight: '800', color: '#9CA3AF' },
  routeCardDivider: { height: 1, backgroundColor: '#333', marginBottom: 10 },
  routeItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  routeText: { marginLeft: 12, fontWeight: '800', color: '#FFF' },
  routeDivider: { height: 1, backgroundColor: '#333', marginLeft: 28, marginVertical: 4 },

  tripInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tripInfoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  tripInfoLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '800' },
  tripInfoValue: { fontSize: 13, color: '#FFF', fontWeight: '800' },
  driverRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  driverName: { fontWeight: '900', fontSize: 16, color: '#FFF' },
  driverRating: { fontSize: 12, color: '#9CA3AF', marginTop: 2, fontWeight: '800' },
  plateText: { fontWeight: '900', fontSize: 14, color: '#FFF' },
  vehicleText: { fontSize: 12, color: '#9CA3AF', fontWeight: '800' },
  
  actionButtons: { flexDirection: 'row', marginBottom: 16 },
  btnAction: { padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnActionIcon: { width: 44, height: 44, backgroundColor: '#333', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  btnActionText: { fontWeight: 'bold', color: '#FFF' },
  
  cancelBtnEnhanced: { backgroundColor: '#1C1C1E', padding: 12, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#ef4444' },
  cancelBtnTextEnhanced: { fontWeight: '900', color: '#ef4444', fontSize: 15, marginLeft: 8, marginRight: 8 },

  callCaptainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: 13, paddingHorizontal: 20, borderRadius: 16, marginTop: 8, marginBottom: 8, borderWidth: 0 },
  callCaptainText: { color: '#000', fontWeight: '900', fontSize: 16, marginLeft: 10 },

  cancelBtn: { backgroundColor: '#1C1C1E', padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  cancelBtnText: { fontWeight: '900', color: '#ef4444' },

  pickupMarkerDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#fff', elevation: 4 },
  pickupMarkerInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },

  dropoffFlag: { backgroundColor: COLORS.primary, padding: 6, borderRadius: 10, borderWidth: 2, borderColor: '#fff', elevation: 4 },

  etaBubble: { backgroundColor: '#111', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 4, alignSelf: 'center' },
  etaBubbleText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  carMarkerBox: { backgroundColor: '#333', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 5 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: '#333' },
  safetyOptionBtn: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', borderRadius: 12, marginVertical: 4 },
  safetyOptionText: { fontSize: 16, textAlign: 'center', color: '#FFF', fontWeight: '800' },

  // New Interlocking Two-Tone Sheet Styles
  sheetTopDark: { backgroundColor: '#1C1C1E', height: 200, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 32, position: 'relative' },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetMakeModel: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  sheetSubInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  sheetSubText: { fontSize: 13, color: '#9CA3AF', fontWeight: '700' },
  sheetCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  sheetCarImg: { position: 'absolute', top: 30, right: -20, width: 220, height: 110 },

  sheetBottomWhite: { backgroundColor: '#FFFFFF', marginTop: -40, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, minHeight: 300, ...SHADOWS.lg },
  sheetSectionTitle: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 16 },
  featuresGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 32 },
  featureBox: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'flex-start' },
  featureTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginTop: 12, marginBottom: 2 },
  featureSub: { fontSize: 11, color: '#6B7280', fontWeight: '700' },
  
  sheetFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetPrice: { fontSize: 36, fontWeight: '900', color: '#111', letterSpacing: -1 },
  sheetPriceSub: { fontSize: 16, color: '#6B7280', fontWeight: '700', marginLeft: 4 },
  sheetActionBtn: { backgroundColor: '#000', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 30 },
  sheetActionText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  
  cancelTxtBtn: { alignSelf: 'center', marginTop: 16, paddingVertical: 8, paddingHorizontal: 16 },
  cancelTxtBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 14 }
});
