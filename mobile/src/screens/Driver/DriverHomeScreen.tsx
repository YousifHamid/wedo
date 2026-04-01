import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Power, MapPin, Navigation, User, Bell, Wallet, Clock, Car, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { DISPATCH_COUNTDOWN } from '../../config/env';

const { width, height } = Dimensions.get('window');

// Safe map import
let MapView: any = null;
let Marker: any = null;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
} catch (e) {}

export default function DriverHomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const isRTL = i18n.language === 'ar';
  
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [location, setLocation] = useState<any>(null);
  const [mapError, setMapError] = useState(false);
  const [incomingTrip, setIncomingTrip] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [countdown, setCountdown] = useState(DISPATCH_COUNTDOWN);
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance ?? 0);
  const [todayTrips, setTodayTrips] = useState(user?.totalTrips ?? 0);
  const [todayEarnings, setTodayEarnings] = useState(user?.totalEarnings ?? 0);

  const isBlocked = walletBalance <= 0;

  // Fetch real wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get('/wallet/balance');
        setWalletBalance(response.data.balance);
        updateUser({ walletBalance: response.data.balance });
      } catch (e) {}
    };
    fetchBalance();
  }, []);

  // Location tracking
  useEffect(() => {
    let locationSub: any = null;
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);

        // Continuous location updates when online
        if (isOnline) {
          locationSub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
            (newLoc) => {
              setLocation(newLoc.coords);
              // Send location to server via socket
              const socket = getSocket();
              if (socket) {
                socket.emit('driver:location_update', {
                  lat: newLoc.coords.latitude,
                  lng: newLoc.coords.longitude,
                });
              }
            }
          );
        }
      } catch (e) {}
    })();

    return () => {
      if (locationSub) locationSub.remove();
    };
  }, [isOnline]);

  // Listen for incoming trip requests via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('trip:incoming_request', (data: any) => {
      if (isOnline && !activeTrip) {
        setIncomingTrip(data);
        setCountdown(DISPATCH_COUNTDOWN);
      }
    });

    socket.on('driver:blocked', (data: any) => {
      Alert.alert(
        isRTL ? 'تم حظر الحساب' : 'Account Blocked',
        data.message || (isRTL ? 'رصيد المحفظة غير كافٍ' : 'Insufficient wallet balance')
      );
      setIsOnline(false);
    });

    socket.on('driver:status_confirmed', (data: any) => {
      setIsOnline(data.isOnline);
    });

    return () => {
      socket.off('trip:incoming_request');
      socket.off('driver:blocked');
      socket.off('driver:status_confirmed');
    };
  }, [isOnline, activeTrip]);

  // Countdown for incoming trip
  useEffect(() => {
    if (incomingTrip && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
    if (countdown === 0 && incomingTrip) {
      // Auto-reject on timeout
      handleReject();
    }
  }, [incomingTrip, countdown]);

  const handleAccept = async () => {
    try {
      const response = await api.post(`/trip/${incomingTrip.tripId}/accept`);
      setActiveTrip({ ...incomingTrip, ...response.data.trip });
      setIncomingTrip(null);

      // Join trip room
      const socket = getSocket();
      if (socket) {
        socket.emit('trip:join_room', incomingTrip.tripId);
        socket.emit('trip:driver_response', {
          tripId: incomingTrip.tripId,
          response: 'accepted',
        });
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.message || 'Failed to accept trip');
    }
  };

  const handleReject = async () => {
    try {
      if (incomingTrip?.tripId) {
        await api.post(`/trip/${incomingTrip.tripId}/reject`);
        const socket = getSocket();
        if (socket) {
          socket.emit('trip:driver_response', {
            tripId: incomingTrip.tripId,
            response: 'rejected',
          });
        }
      }
    } catch (e) {}
    setIncomingTrip(null);
  };

  const handleToggleOnline = () => {
    if (isBlocked) {
      Alert.alert(
        isRTL ? 'المحفظة فارغة' : 'Wallet Empty',
        isRTL ? 'يرجى شحن المحفظة أولاً' : 'Please top up your wallet first'
      );
      return;
    }

    const newStatus = !isOnline;
    const socket = getSocket();
    if (socket) {
      socket.emit('driver:status_change', { isOnline: newStatus });
    }
    setIsOnline(newStatus);
    updateUser({ isOnline: newStatus });
  };

  const handleCompleteTrip = async () => {
    try {
      if (activeTrip?._id || activeTrip?.tripId) {
        const tripId = activeTrip._id || activeTrip.tripId;
        await api.put(`/trip/${tripId}/status`, { status: 'completed' });

        // Refresh wallet
        const balRes = await api.get('/wallet/balance');
        setWalletBalance(balRes.data.balance);
        updateUser({ walletBalance: balRes.data.balance });
      }
    } catch (e) {}
    setActiveTrip(null);
  };

  const renderMap = () => {
    if (MapView && !mapError) {
      try {
        return (
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 15.5007, longitude: 32.5599, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            region={location ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 } : undefined}
          >
            {location && Marker && (
              <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
                <View style={styles.driverMarker}><Car color="#fff" size={16} /></View>
              </Marker>
            )}
          </MapView>
        );
      } catch (e) { setMapError(true); }
    }
    return (
      <View style={styles.mapFallback}>
        <View style={styles.mapGrid}>
          {Array.from({ length: 25 }).map((_, i) => <View key={`h${i}`} style={[styles.gridLineH, { top: i * 32 }]} />)}
          {Array.from({ length: 15 }).map((_, i) => <View key={`v${i}`} style={[styles.gridLineV, { left: i * (width / 14) }]} />)}
        </View>
        <View style={styles.mapCenterDot}>
          <View style={styles.mapCenterDotInner}><Car color="#fff" size={14} /></View>
        </View>
      </View>
    );
  };

  // Blocked state overlay
  if (isBlocked) {
    return (
      <View style={styles.container}>
        {renderMap()}
        <View style={styles.blockedOverlay}>
          <View style={styles.blockedCard}>
            <View style={styles.blockedIcon}><Wallet color={COLORS.error} size={40} /></View>
            <Text style={styles.blockedTitle}>{t('driver_blocked')}</Text>
            <Text style={styles.blockedSub}>{t('blocked_subtitle')}</Text>
            <TouchableOpacity style={styles.topUpBtn} onPress={() => navigation.navigate('DriverWallet')}>
              <Text style={styles.topUpBtnText}>{t('top_up_wallet')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderMap()}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
          <User color={COLORS.onSurface} size={22} />
        </TouchableOpacity>

        {/* Online badge */}
        <View style={[styles.statusBadge, isOnline && styles.statusBadgeOnline]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.primary : COLORS.onSurfaceVariant }]} />
          <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
            {isOnline ? t('online') : t('offline')}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Bell color={COLORS.onSurface} size={22} />
        </TouchableOpacity>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSheet}>
        {/* Earnings summary strip */}
        {isOnline && (
          <View style={styles.earningsStrip}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>{todayTrips}</Text>
              <Text style={styles.earningsLabel}>{t('tab_trips')}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>{t('sdg')} {(todayEarnings / 1000).toFixed(1)}k</Text>
              <Text style={styles.earningsLabel}>{t('total_earnings')}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>{t('sdg')} {(walletBalance / 1000).toFixed(1)}k</Text>
              <Text style={styles.earningsLabel}>{t('wallet_balance')}</Text>
            </View>
          </View>
        )}

        {/* Go Online / Offline Button */}
        <TouchableOpacity
          style={[styles.goBtn, isOnline && styles.goBtnOffline]}
          onPress={handleToggleOnline}
          activeOpacity={0.85}
        >
          <Power color="#fff" size={22} />
          <Text style={styles.goBtnText}>
            {isOnline ? t('go_offline') : t('go_online')}
          </Text>
        </TouchableOpacity>

        {/* Quick navigation row */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('DriverWallet')}>
            <View style={styles.quickIcon}><Wallet color={COLORS.onSurfaceVariant} size={20} /></View>
            <Text style={styles.quickLabel}>{t('tab_wallet')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem}>
            <View style={styles.quickIcon}><Clock color={COLORS.onSurfaceVariant} size={20} /></View>
            <Text style={styles.quickLabel}>{t('tab_trips')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.quickIcon}><User color={COLORS.onSurfaceVariant} size={20} /></View>
            <Text style={styles.quickLabel}>{t('tab_profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Incoming Trip Modal */}
      <Modal visible={!!incomingTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <Bell color={COLORS.primary} fill={COLORS.primary} size={24} />
              <Text style={styles.requestTitle}>{t('new_trip_request')}</Text>
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}s</Text>
              </View>
            </View>
            
            <View style={styles.tripZones}>
              <View style={styles.tripZoneItem}>
                <MapPin size={16} color={COLORS.primary} />
                <Text style={styles.tripZoneText}>
                  {isRTL ? incomingTrip?.pickupZone?.nameAr || incomingTrip?.pickupZone : incomingTrip?.pickupZone?.name || incomingTrip?.pickupZoneEn || 'Pickup'}
                </Text>
              </View>
              <View style={styles.tripZoneItem}>
                <Navigation size={16} color={COLORS.warning} />
                <Text style={styles.tripZoneText}>
                  {isRTL ? incomingTrip?.dropoffZone?.nameAr || incomingTrip?.dropoffZone : incomingTrip?.dropoffZone?.name || incomingTrip?.dropoffZoneEn || 'Dropoff'}
                </Text>
              </View>
            </View>

            <View style={styles.fareInfo}>
              <View>
                <Text style={styles.fareInfoLabel}>{t('trip_fare')}</Text>
                <Text style={styles.fareInfoValue}>{t('sdg')} {incomingTrip?.fareEstimate?.toLocaleString() || incomingTrip?.fare?.toLocaleString()}</Text>
              </View>
              <View>
                <Text style={styles.fareInfoLabel}>{t('commission_deduction')}</Text>
                <Text style={[styles.fareInfoValue, { color: COLORS.error }]}>
                  -{t('sdg')} {Math.round((incomingTrip?.fareEstimate || incomingTrip?.fare || 0) * 0.15).toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Text style={styles.acceptBtnText}>{t('accept_trip')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
              <Text style={styles.rejectBtnText}>{t('reject_trip')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Active Trip Card */}
      {activeTrip && (
        <View style={styles.activeSheet}>
          <View style={styles.activeHeader}>
            <View style={styles.activePulse} />
            <Text style={styles.activeLabel}>{t('active_trip')}</Text>
          </View>
          <Text style={styles.activeTitle}>{t('heading_to_pickup')}</Text>
          <View style={styles.activeRiderRow}>
            <Text style={styles.activeRider}>
              {activeTrip.rider?.name || (isRTL ? activeTrip.riderName : activeTrip.riderNameEn) || 'Rider'}
            </Text>
            <Text style={styles.activeFare}>
              {t('sdg')} {(activeTrip.fareEstimate || activeTrip.fare)?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.activeActions}>
            <TouchableOpacity style={styles.navBtn}>
              <Navigation color={COLORS.onPrimary} size={16} />
              <Text style={styles.navText}>{t('navigate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statusUpdateBtn} onPress={handleCompleteTrip}>
              <Text style={styles.statusUpdateText}>{t('complete_trip')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },

  // Fallback
  mapFallback: { flex: 1, backgroundColor: '#e8d5b8', position: 'relative' },
  mapGrid: { flex: 1, opacity: 0.08 },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.primary },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: COLORS.primary },
  mapCenterDot: { position: 'absolute', top: '42%', left: '50%', marginLeft: -22, marginTop: -22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  mapCenterDotInner: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  driverMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },

  // Top
  topBar: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.surfaceContainerLowest,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.md,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full, ...SHADOWS.md,
  },
  statusBadgeOnline: { backgroundColor: COLORS.primaryFixed },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 1 },
  statusTextOnline: { color: COLORS.primary },

  // Bottom
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'],
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28,
    ...SHADOWS.lg,
  },

  earningsStrip: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg, paddingVertical: 14, marginBottom: 16,
  },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsDivider: { width: 1, backgroundColor: COLORS.surfaceContainerHigh },
  earningsValue: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.onSurface },
  earningsLabel: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginTop: 2 },

  goBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: RADIUS.xl,
    marginBottom: 16, ...SHADOWS.md,
  },
  goBtnOffline: { backgroundColor: COLORS.error },
  goBtnText: { color: '#fff', fontSize: FONT_SIZES.lg, fontWeight: 'bold', marginLeft: 10 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-around' },
  quickItem: { alignItems: 'center' },
  quickIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  quickLabel: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, fontWeight: '600' },

  // Blocked
  blockedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  blockedCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS['2xl'], padding: SPACING['3xl'], margin: 32, alignItems: 'center' },
  blockedIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  blockedTitle: { fontSize: FONT_SIZES['2xl'], fontWeight: 'bold', color: COLORS.error, marginBottom: SPACING.sm, textAlign: 'center' },
  blockedSub: { fontSize: FONT_SIZES.md, color: COLORS.onSurfaceVariant, marginBottom: SPACING.xl, textAlign: 'center' },
  topUpBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, paddingHorizontal: SPACING['3xl'], borderRadius: RADIUS.xl },
  topUpBtnText: { color: COLORS.onPrimary, fontSize: FONT_SIZES.md, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  requestCard: { backgroundColor: COLORS.surfaceContainerLowest, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACING['2xl'], paddingBottom: 50 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl },
  requestTitle: { flex: 1, marginLeft: SPACING.md, fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary },
  countdownBadge: { backgroundColor: COLORS.primaryFixed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  countdownText: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.primary },
  tripZones: { marginBottom: SPACING.xl },
  tripZoneItem: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  tripZoneText: { marginLeft: SPACING.md, fontSize: FONT_SIZES.lg, color: COLORS.onSurface, fontWeight: '600' },
  fareInfo: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.lg, padding: SPACING.xl, marginBottom: SPACING.xl },
  fareInfoLabel: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginBottom: 4 },
  fareInfoValue: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },
  acceptBtn: { backgroundColor: COLORS.success, paddingVertical: SPACING.xl, borderRadius: RADIUS.xl, alignItems: 'center', marginBottom: SPACING.md },
  acceptBtnText: { color: COLORS.onPrimary, fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
  rejectBtn: { paddingVertical: SPACING.md, alignItems: 'center' },
  rejectBtnText: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZES.md, fontWeight: '600' },

  // Active Trip
  activeSheet: {
    position: 'absolute', bottom: 200, left: 16, right: 16,
    backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS.xl,
    padding: SPACING.xl, ...SHADOWS.lg,
  },
  activeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  activePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 8 },
  activeLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  activeTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.onSurface, marginBottom: SPACING.md },
  activeRiderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  activeRider: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },
  activeFare: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.primary },
  activeActions: { flexDirection: 'row', gap: 8 },
  navBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.dark, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  navText: { color: COLORS.onPrimary, fontWeight: '600', marginLeft: 6, fontSize: FONT_SIZES.sm },
  statusUpdateBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  statusUpdateText: { color: COLORS.onPrimary, fontSize: FONT_SIZES.sm, fontWeight: 'bold' },
});
