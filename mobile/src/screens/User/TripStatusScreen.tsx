import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Share, Modal, Platform, Dimensions } from 'react-native';
import { Navigation, Phone, MapPin, ChevronRight, AlertCircle, PlusCircle, Share2, ShieldAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import useAuthStore from '../../store/useAuthStore';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { SafeMapView as MapView, SafeMarker as Marker } from '../../components/MapViewMock';


const { width } = Dimensions.get('window');

export default function TripStatusScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { pickupZone, dropoffZone, fareEstimate, assignedDriver, currentTrip, setTripStatus, resetTrip, stops, addStop } = useTripStore();
  const [tripPhase, setTripPhase] = useState<'en_route_pickup' | 'arrived' | 'in_progress' | 'completed'>(
    (currentTrip?.status as any) || 'en_route_pickup'
  );
  const [showDeviationAlert, setShowDeviationAlert] = useState(false);
  const [deviationDismissed, setDeviationDismissed] = useState(false);
  const [vehiclePos, setVehiclePos] = useState({ latitude: 15.5007, longitude: 32.5599 });

  const getZoneLabel = (zone: any) => isRTL ? zone?.nameAr : zone?.name;

  useEffect(() => {
    // Simulation for demo movement
    const moveInterval = setInterval(() => {
       setVehiclePos(prev => ({
          latitude: prev.latitude + (Math.random() - 0.5) * 0.0005,
          longitude: prev.longitude + (Math.random() - 0.5) * 0.0005,
       }));
    }, 3000);

    const { isServerEnabled } = useAuthStore.getState();
    if (!isServerEnabled) {
      const timers: any[] = [];
      timers.push(setTimeout(() => setTripPhase('arrived'), 8000));
      timers.push(setTimeout(() => setTripPhase('in_progress'), 15000));
      timers.push(setTimeout(() => {
        setTripPhase('completed');
        setTripStatus('completed');
        navigation.navigate('TripComplete');
      }, 25000));
      return () => {
        clearInterval(moveInterval);
        timers.forEach(t => clearTimeout(t));
      };
    }

    const socket = getSocket();
    if (!socket) return;
    socket.on('trip:status_updated', (data: any) => {
      if (data.status === 'arrived') setTripPhase('arrived');
      else if (data.status === 'active') setTripPhase('in_progress');
      else if (data.status === 'completed') {
        setTripPhase('completed');
        setTripStatus('completed');
        navigation.navigate('TripComplete');
      }
    });

    return () => {
      clearInterval(moveInterval);
      socket.off('trip:status_updated');
    };
  }, []);

  const getStatusLabel = () => {
    switch (tripPhase) {
      case 'en_route_pickup': return isRTL ? 'الكابتن في الطريق إليك' : t('driver_arriving');
      case 'arrived': return isRTL ? 'الكابتن وصل' : t('arrived_pickup');
      case 'in_progress': return isRTL ? 'في الطريق' : t('en_route');
      case 'completed': return isRTL ? 'وصلت بسلامة' : t('trip_complete');
      default: return isRTL ? 'الكابتن قادم' : t('driver_arriving');
    }
  };

  const handleCall = () => Alert.alert(t('call_driver'), `${t('phone_label')}: ${assignedDriver?.phone || '---'}`);

  const handleCancel = () => {
    Alert.alert(isRTL ? 'إلغاء الرحلة' : 'Cancel Trip', isRTL ? 'هل أنت متأكد من إلغاء الرحلة؟' : 'Are you sure?', [
      { text: isRTL ? 'لا' : 'No', style: 'cancel' },
      { text: isRTL ? 'نعم، ألغِ' : 'Yes', onPress: () => { resetTrip(); navigation.navigate('UserHome'); } }
    ]);
  };

  const handleShareTrip = async () => {
    try {
      await Share.share({ message: isRTL ? 'تتبع رحلتي مع ودّو!' : 'Track my Wedo trip!' });
    } catch (e) {}
  };

  const handleComplaint = () => Alert.alert(isRTL ? 'مركز الأمان' : 'Safety Center', isRTL ? 'تم استلام بلاغك. سيتم المتابعة من فريقنا' : 'Report received');

  const handleAddStopAtRide = () => {
     addStop({ _id: 'new_stop', name: 'New Stop', nameAr: 'وقفة جديدة' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapBg}>
        {MapView ? (
          <MapView style={styles.map} initialRegion={{ latitude: 15.5007, longitude: 32.5599, latitudeDelta: 0.1, longitudeDelta: 0.1 }}>
            {Marker && (
              <Marker coordinate={vehiclePos}>
                <View style={styles.carMarker}><Navigation color="#fff" size={16} /></View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={styles.mapGridPlaceholder} />
        )}
      </View>

      {/* Trip Timeline Progress */}
      <View style={styles.timelineBar}>
        <View style={styles.timelineSteps}>
          {/* Step 1: Start */}
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.timelineDotText}>1</Text>
            </View>
            <Text style={[styles.timelineLabel, { color: COLORS.primary, fontWeight: 'bold' }]}>{isRTL ? 'بداية' : 'Start'}</Text>
          </View>

          {/* Line 1→2 */}
          <View style={[styles.timelineLine, { backgroundColor: tripPhase === 'en_route_pickup' ? '#e5e5e5' : COLORS.primary }]} />

          {/* Step 2: En Route */}
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: (tripPhase === 'in_progress' || tripPhase === 'arrived' || tripPhase === 'completed') ? COLORS.primary : '#ccc' }]}>
              <Text style={styles.timelineDotText}>2</Text>
            </View>
            <Text style={[styles.timelineLabel, { color: (tripPhase === 'in_progress' || tripPhase === 'arrived') ? COLORS.primary : '#999' }]}>
              {isRTL ? 'في الطريق' : 'En Route'}
            </Text>
          </View>

          {/* Line 2→3 */}
          <View style={[styles.timelineLine, { backgroundColor: tripPhase === 'completed' ? COLORS.success : '#e5e5e5' }]} />

          {/* Step 3: Arriving */}
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: tripPhase === 'completed' ? COLORS.success : '#ccc' }]}>
              <Text style={styles.timelineDotText}>3</Text>
            </View>
            <Text style={[styles.timelineLabel, { color: tripPhase === 'completed' ? COLORS.success : '#999' }]}>
              {isRTL ? 'الوصول' : 'Arriving'}
            </Text>
          </View>
        </View>

        {/* Current Status Text */}
        <View style={[styles.statusPill, { backgroundColor: tripPhase === 'in_progress' ? '#e8f5e9' : tripPhase === 'arrived' ? '#fff3e0' : '#e3f2fd' }]}>
          <View style={[styles.statusPulse, { backgroundColor: tripPhase === 'in_progress' ? COLORS.primary : tripPhase === 'arrived' ? COLORS.warning : COLORS.primary }]} />
          <Text style={[styles.statusPillText, { color: tripPhase === 'in_progress' ? COLORS.primary : tripPhase === 'arrived' ? '#f59e0b' : COLORS.primary }]}>
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.routeCard}>
          <View style={[styles.routeItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <MapPin color={COLORS.primary} size={16} />
            <Text style={styles.routeText}>{getZoneLabel(pickupZone)}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={[styles.routeItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <Navigation color={COLORS.warning} size={16} />
            <Text style={styles.routeText}>{getZoneLabel(dropoffZone)}</Text>
          </View>
        </View>

        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>{t('total_fare')}</Text>
          <Text style={styles.fareAmount}>{t('sdg')} {fareEstimate.toLocaleString()}</Text>
        </View>

        <View style={[styles.driverRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={styles.driverAvatar}><Text style={styles.avatarText}>A</Text></View>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.driverName}>{assignedDriver?.name}</Text>
            <Text style={styles.driverVehicle}>{assignedDriver?.vehicleDetails?.make} • {assignedDriver?.vehicleDetails?.plateNumber}</Text>
          </View>
          <TouchableOpacity onPress={handleCall} style={styles.callIcon}><Phone size={18} color={COLORS.onSurface} /></TouchableOpacity>
        </View>

        <View style={[styles.safetyActionRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity style={[styles.safetyActionBtn, { backgroundColor: COLORS.primaryContainer }]} onPress={handleShareTrip}>
            <Share2 color={COLORS.onPrimaryContainer} size={20} /><Text style={{ marginLeft: 8 }}>{isRTL ? 'مشاركة' : 'Share'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.safetyActionBtn, { backgroundColor: '#fee2e2', marginLeft: 12 }]} onPress={handleComplaint}>
            <ShieldAlert color={COLORS.error} size={20} /><Text style={{ marginLeft: 8, color: COLORS.error }}>{isRTL ? 'أمان' : 'Safety'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}><Text style={styles.cancelBtnText}>{t('cancel_request')}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8d5b8' },
  mapBg: { flex: 1 },
  map: { width: '100%', height: '100%' },
  mapGridPlaceholder: { flex: 1, backgroundColor: '#e8d5b8' },

  // Timeline
  timelineBar: { position: 'absolute', top: 50, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, ...SHADOWS.md, zIndex: 10 },
  timelineSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  timelineStep: { alignItems: 'center', width: 70 },
  timelineDot: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  timelineDotText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  timelineLabel: { fontSize: 10, fontWeight: '600' },
  timelineLine: { height: 3, flex: 1, borderRadius: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginTop: 12, alignSelf: 'center' },
  statusPulse: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusPillText: { fontSize: 13, fontWeight: 'bold' },

  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...SHADOWS.lg },
  routeCard: { backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 12, marginBottom: 16 },
  routeItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  routeText: { marginLeft: 12, fontWeight: 'bold' },
  routeDivider: { height: 1, backgroundColor: '#eee', marginLeft: 28, marginVertical: 4 },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  fareLabel: { color: COLORS.onSurfaceVariant },
  fareAmount: { fontSize: 20, fontWeight: 'bold' },
  driverRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 12, marginBottom: 16 },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  driverName: { fontWeight: 'bold' },
  driverVehicle: { fontSize: 12, color: COLORS.onSurfaceVariant },
  callIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  safetyActionRow: { flexDirection: 'row', marginBottom: 16 },
  safetyActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12 },
  cancelBtn: { backgroundColor: '#eee', padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontWeight: 'bold' },
  carMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' }
});
