import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, Alert, Keyboard, TextInput, Switch, Platform, Linking, Image } from 'react-native';
import { Power, MapPin, Navigation, User, Wallet, Clock, Car, TrendingUp, Banknote, Layers, PlusCircle, Shield, Crown, X, ChevronRight, Search, Menu } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import useAuthStore from '../../store/useAuthStore';
import useTripStore from '../../store/useTripStore';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import soundManager from '../../services/soundManager';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { DISPATCH_COUNTDOWN } from '../../config/env';
import { SafeMapView as MapView, SafeMarker as Marker, SafePolyline as Polyline } from '../../components/MapViewMock';
import InteractiveMapMock from '../../components/InteractiveMapMock';
import SwipeableBottomSheet from '../../components/SwipeableBottomSheet';

const PROVIDER_GOOGLE = null;

const { width, height } = Dimensions.get('window');

export default function DriverHomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const isRTL = i18n.language === 'ar';
  
  const [isOnline, setIsOnline] = useState(false); // Always starts OFFLINE
  const [location, setLocation] = useState<any>(null);
  const [mapError, setMapError] = useState(false);
  const [incomingTrip, setIncomingTrip] = useState<any>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [countdown, setCountdown] = useState(DISPATCH_COUNTDOWN);
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance ?? 0);
  const [todayTrips, setTodayTrips] = useState(user?.totalTrips ?? 0);
  const [todayEarnings, setTodayEarnings] = useState(user?.totalEarnings ?? 0);

  const [showDemandMap, setShowDemandMap] = useState(false);
  const [demandRadius, setDemandRadius] = useState(3);
  const [demandClusters, setDemandClusters] = useState<any[]>([]);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  const [tripStep, setTripStep] = useState<'arrived' | 'started' | 'completing'>('arrived');
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [showDeviationAlert, setShowDeviationAlert] = useState(false);
  const [deviationDismissed, setDeviationDismissed] = useState(false);
  const [tripStartLocation, setTripStartLocation] = useState<any>(null);
  const [addChangeToWallet, setAddChangeToWallet] = useState(false);

  const [rejectionCount, setRejectionCount] = useState(0);
  const [penaltyUntil, setPenaltyUntil] = useState<number | null>(null);
  const [penaltyLevel, setPenaltyLevel] = useState(0);

  const isPenalized = penaltyUntil !== null && Date.now() < penaltyUntil;
  const isBlocked = walletBalance <= 0 || isPenalized;

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

  useEffect(() => {
    let locationSub: any = null;
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);

        if (isOnline) {
          locationSub = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 50 },
            (newLoc) => {
              setLocation(newLoc.coords);
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

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  useEffect(() => {
    if (showDemandMap && location) {
      const spread = demandRadius * 0.012;
      const clusters = Array.from({ length: 15 }).map((_, i) => ({
        id: `cluster-${i}`,
        latitude: location.latitude + (Math.random() - 0.5) * spread,
        longitude: location.longitude + (Math.random() - 0.5) * spread,
        weight: Math.floor(Math.random() * 60) + 15,
      }));
      setDemandClusters(clusters);
    }
  }, [showDemandMap, location, demandRadius]);

  useEffect(() => {
    if (tripStep === 'started' && activeTrip && !deviationDismissed) {
      if (!tripStartLocation && location) {
        setTripStartLocation({ latitude: location.latitude, longitude: location.longitude });
      }
      const deviationTimer = setTimeout(() => {
        if (!deviationDismissed && !showDeviationAlert) {
          setShowDeviationAlert(true);
        }
      }, 12000);
      return () => clearTimeout(deviationTimer);
    }
  }, [tripStep, activeTrip, deviationDismissed]);

  useEffect(() => {

    const socket = getSocket();
    if (!socket) return;

    socket.on('trip:incoming_request', (data: any) => {
      const canAccept = isOnline && (!activeTrip || (activeTrip && tripStep === 'started'));
      if (canAccept && !incomingTrip) {
        setIncomingTrip({ ...data, isQueuedTrip: !!activeTrip });
        setCountdown(DISPATCH_COUNTDOWN);
        // 🔔 Play driver ringtone
        soundManager.playDriverNewTrip();
      }
    });

    socket.on('driver:blocked', (data: any) => {
      Alert.alert(isRTL ? 'تم حظر الحساب' : 'Account Blocked', data.message);
      setIsOnline(false);
    });

    return () => {
      socket.off('trip:incoming_request');
      socket.off('driver:blocked');
    };
  }, [isOnline, activeTrip, incomingTrip]);

  useEffect(() => {
    if (incomingTrip && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
    if (countdown === 0 && incomingTrip) setIncomingTrip(null);
  }, [incomingTrip, countdown]);

  const handleAccept = async () => {
    soundManager.stopDriverRingtone(); // ✅ Stop ringtone on accept
    setActiveTrip(incomingTrip);
    setIncomingTrip(null);
    setRejectionCount(0);
  };

  const handleToggleOnline = () => {
    if (walletBalance <= 0) {
      Alert.alert(isRTL ? 'المحفظة فارغة' : 'Wallet Empty', isRTL ? 'يرجى شحن المحفظة أولاً' : 'Please top up your wallet');
      return;
    }
    if (isPenalized) {
      const remaining = Math.ceil(((penaltyUntil || 0) - Date.now()) / 60000);
      const hrs = Math.floor(remaining / 60);
      const mins = remaining % 60;
      const timeStr = hrs > 0 ? `${hrs} ساعة و ${mins} دقيقة` : `${mins} دقيقة`;
      Alert.alert(
        isRTL ? 'تم تعليق حسابك مؤقتاً' : 'Account Temporarily Suspended',
        isRTL ? `بسبب رفض عدد كبير من الرحلات المتتالية، تم تعليق قبول الرحلات.\nالوقت المتبقي: ${timeStr}` : `Due to excessive trip rejections, your account is suspended.\nTime remaining: ${timeStr}`
      );
      return;
    }
    setIsOnline(!isOnline);
  };

  const handleRejectTrip = () => {
    soundManager.stopDriverRingtone(); // 🔇 Stop ringtone on reject
    const newCount = rejectionCount + 1;
    setRejectionCount(newCount);
    setIncomingTrip(null);

    if (newCount >= 15) {
      setPenaltyUntil(Date.now() + 24 * 60 * 60 * 1000);
      setIsOnline(false);
      setRejectionCount(0);
      Alert.alert(isRTL ? '⛔ تم تعليق حسابك 24 ساعة' : '⛔ Suspended for 24 Hours', isRTL ? 'قمت برفض 15 رحلة متتالية.' : 'Rejected 15 trips.');
    } else if (newCount >= 10) {
      setPenaltyUntil(Date.now() + 60 * 60 * 1000);
      setIsOnline(false);
      Alert.alert(isRTL ? '⚠️ تم تعليق حسابك ساعة واحدة' : '⚠️ Suspended for 1 Hour', isRTL ? 'قمت برفض 10 رحلات.' : 'Rejected 10 trips.');
    } else if (newCount >= 5) {
      setPenaltyUntil(Date.now() + 15 * 60 * 1000);
      setIsOnline(false);
      Alert.alert(isRTL ? 'تنبيه: تم إيقاف قبول الرحلات 15 دقيقة' : 'Warning: 15-Minute Pause', isRTL ? 'قمت برفض 5 رحلات.' : 'Rejected 5 trips.');
    }
  };

  const handleCompleteTrip = () => {
    const baseFare = (activeTrip?.fareEstimate || activeTrip?.fare || 0);
    const waitingFee = 2000; 
    const total = baseFare + waitingFee;
    const payment = activeTrip?.paymentType || 'cash';

    setSummaryData({ baseFare, waitingFee, total, paymentType: payment });
    setReceivedCash('');
    setShowTripSummary(true);
  };

  const finalizeTrip = () => {
    if (!summaryData) return;
    const total = summaryData.total || 0;
    const received = Number(receivedCash) || 0;
    const changeAmount = received > total ? received - total : 0;

    setTodayEarnings(e => e + total);
    setTodayTrips(t => t + 1);
    setWalletBalance(b => b - (total * (addChangeToWallet && changeAmount > 0 ? 0.05 : 0.15)));
    
    let title = isRTL ? 'تمت الرحلة بنجاح' : 'Trip Completed';
    let msg = '';

    if (changeAmount > 0 && addChangeToWallet) {
      const riderName = activeTrip?.rider?.name || (isRTL ? 'الراكب' : 'Rider');
      title = isRTL ? '✅ تم الإنهاء والإيداع' : '✅ Completed & Deposited';
      msg = isRTL 
        ? `تم إيداع ${t('sdg')} ${changeAmount.toLocaleString()} في محفظة ${riderName}.\n\nتم إشعار الزبون بالإيداع.\n\nشكراً لك كابتن!`
        : `${t('sdg')} ${changeAmount.toLocaleString()} deposited to ${riderName}'s wallet.\n\nRider has been notified.\n\nThank you, Captain!`;
    } else if (changeAmount > 0) {
      msg = isRTL
        ? `الباقي: ${t('sdg')} ${changeAmount.toLocaleString()}\nتأكد من إعادته للزبون.\n\nأحسنت!`
        : `Change: ${t('sdg')} ${changeAmount.toLocaleString()}\nMake sure to return it to the rider.\n\nGood job!`;
    } else {
      msg = isRTL ? 'أحسنت كابتن!' : 'Good job!';
    }

    setActiveTrip(null);
    setTripStep('arrived');
    setShowTripSummary(false);
    setSummaryData(null);
    setDeviationDismissed(false);
    setTripStartLocation(null);
    setAddChangeToWallet(false);
    setReceivedCash('');

    setTimeout(() => {
      Alert.alert(
        isRTL ? '🌟 إشعار من ودّو' : '🌟 Wedo Notification',
        isRTL ? 'كيف كانت تجربتك في القيادة معنا؟ يسعدنا تقييمك لنا بـ 5 نجوم في المتجر لدعمنا!' : 'How was your driving experience? Please rate us 5 stars on the store to support us!',
        [
          { text: isRTL ? 'لاحقاً' : 'Later', style: 'cancel' },
          { text: isRTL ? 'تقييم الآن' : 'Rate Now', onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.wedo.driver') }
        ]
      );
    }, 1500);

    Alert.alert(title, msg);
  };

  const renderMap = () => {
    if (MapView && !mapError) {
      return (
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{ latitude: 15.5007, longitude: 32.5599, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
          region={location ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 } : undefined}
        >
          {location && Marker && (
            <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}>
              <View style={styles.driverMarker}><Car color="#fff" size={16} /></View>
            </Marker>
          )}

          {showDemandMap && demandClusters.map(cluster => {
            const dist = getDistanceKm(location?.latitude || 0, location?.longitude || 0, cluster.latitude, cluster.longitude);
            if (dist > demandRadius) return null;
            return (
              <Marker key={cluster.id} coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={[styles.demandCircle, { transform: [{ scale: cluster.weight/30 }], opacity: 0.3 }]} />
              </Marker>
            );
          })}
        </MapView>
      );
    }
    return (
      <View style={styles.mapFallback}>
        <MapView style={{ flex: 1 }}>
          {/* Driver Active Trip Nav View */}
          {activeTrip && (
            <>
              <Polyline strokeColor={COLORS.primary} strokeWidth={6} lineDashPattern={undefined} />
              
              <Marker style={{ top: 120, left: 280 }}>
                <View style={styles.destinationBox}>
                  <MapPin color="#fff" size={12} />
                </View>
              </Marker>

              <Marker style={{ top: 280, left: 160 }}>
                <View style={styles.navCarRing}>
                  <View style={styles.navCarDot} />
                </View>
              </Marker>

              <View style={styles.navOverlayHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Navigation color={COLORS.primary} size={22} style={{ transform: [{rotate: '45deg'}], marginRight: 14 }} />
                  <View>
                    <Text style={styles.navDistance}>1.5 km</Text>
                    <Text style={styles.navRoadName}>E Main St</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {!activeTrip && (
            <View style={styles.mapCenterDot}>
              <View style={styles.mapCenterDotInner}>
                <Car color="#fff" size={14} />
              </View>
            </View>
          )}
        </MapView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
          <Menu color="#1C1C1E" size={20} />
        </TouchableOpacity>
        <View style={[styles.statusBadge, isOnline && styles.statusBadgeOnline]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : '#94A3B8' }]} />
          <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>{isOnline ? t('online') : t('offline')}</Text>
        </View>
        <View style={styles.wedoBrandPill}>
          <Text style={styles.wedoBrandText}>Wedo</Text>
        </View>
      </View>

      {/* Demand Map Legend */}
      {showDemandMap && (
        <View style={styles.demandLegend}>
          <View style={styles.rowBetween}>
            <Text style={styles.legendTitle}>{isRTL ? 'نطاق العمل واستقبال الطلبات' : 'Work & Request Radius'}</Text>
            <Text style={styles.legendRadius}>{demandRadius} km</Text>
          </View>
          <View style={[styles.radiusBar, { marginTop: 12 }]}>
            {[1, 2, 3, 5, 7].map(r => (
              <TouchableOpacity key={r} onPress={() => setDemandRadius(r)} style={[styles.radiusStep, demandRadius === r && styles.radiusStepActive]}>
                <Text style={[styles.radiusText, demandRadius === r && styles.radiusTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* FAB Buttons */}
      {!activeTrip && (
        <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={[styles.fab, showDemandMap && { backgroundColor: COLORS.primary }]} 
            onPress={() => setShowDemandMap(!showDemandMap)}
          >
            <TrendingUp size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.fab, isOnline && styles.fabOnline]} 
            onPress={handleToggleOnline}
          >
            <Power size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Welcome Banner — shown when offline with no active trip */}
      {!isOnline && !activeTrip && (
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeBannerEmoji}>🚗</Text>
          <Text style={styles.welcomeBannerTitle}>
            {isRTL ? `مرحباً ${user?.name?.split(' ')[0] || 'كابيتانو'}!` : `Welcome, Captain!`}
          </Text>
          <Text style={styles.welcomeBannerSub}>
            {isRTL ? 'ابدأ الآن وزِد دخلك يا كابيتانو 💪' : 'Go online now and start earning!'}
          </Text>
          <TouchableOpacity style={styles.welcomeBannerBtn} onPress={handleToggleOnline} activeOpacity={0.85}>
            <Power size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.welcomeBannerBtnText}>{isRTL ? 'ابدأ استقبال الرحلات' : 'Start Receiving Trips'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Trip Sheet */}
      {activeTrip && (
        <SwipeableBottomSheet snapPoints={[340, 100]} initialSnapIndex={0} style={{ padding: 0 }}>
          <View style={styles.activeSheetContent}>
            {/* Driver Card — Active Trip */}
            <View style={[styles.activeTripHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.activeTripAvatar}>
                <User size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={[styles.activeTripTitle, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'رحلة جارية' : t('active_trip')}
                </Text>
                <Text style={[styles.activeTripSub, isRTL && { textAlign: 'right' }]}>
                  {activeTrip?.rider?.name || 'Passenger'}
                </Text>
              </View>
              <View style={[styles.tripPhaseBadge, tripStep === 'started' && { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                <Text style={[styles.tripPhaseText, tripStep === 'started' && { color: '#166534' }]}>
                  {tripStep === 'arrived' ? (isRTL ? 'في الانتظار' : 'Waiting') : (isRTL ? 'قيادة' : 'Driving')}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={[styles.tripActions, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity style={styles.tripActionSmall} onPress={() => {}}>
                <Navigation size={20} color={COLORS.primary} />
                <Text style={styles.tripActionSmallText}>{isRTL ? 'الخريطة' : 'Map'}</Text>
              </TouchableOpacity>

              {tripStep === 'arrived' && (
                <TouchableOpacity style={styles.tripActionMain} onPress={() => setTripStep('started')} activeOpacity={0.85}>
                  <Text style={styles.tripActionMainText}>{isRTL ? 'بدء الرحلة' : 'Start Trip'}</Text>
                </TouchableOpacity>
              )}
              {tripStep === 'started' && (
                <TouchableOpacity 
                  style={[styles.tripActionMain, { backgroundColor: '#1C1C1E' }]} 
                  onPress={handleCompleteTrip}
                  activeOpacity={0.85}
                >
                  <Text style={styles.tripActionMainText}>{isRTL ? 'إنهاء الرحلة' : 'Complete Trip'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SwipeableBottomSheet>
      )}

      {/* ==== Incoming Trip Modal ==== */}
      <Modal visible={!!incomingTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.incomingSheet}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={[styles.incomingHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.incomingAvatar}>
                <User size={22} color="#fff" />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={[styles.incomingTitle, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? 'طلب رحلة جديد' : t('new_trip_request')}
                </Text>
                <View style={[styles.countdownRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Clock size={12} color={COLORS.onSurfaceVariant} />
                  <Text style={styles.countdownText}>{countdown} {isRTL ? 'ث' : 's'}</Text>
                </View>
              </View>
              {/* Countdown Progress */}
              <View style={styles.countdownRing}>
                <Text style={styles.countdownRingText}>{countdown}</Text>
              </View>
            </View>

            {/* Route Details */}
            <View style={[styles.incomingRoute, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.incomingRouteBox}>
                <View style={[styles.incomingRouteDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.incomingRouteLabel}>{isRTL ? 'من' : 'From'}</Text>
                <Text style={styles.incomingRouteZone} numberOfLines={1}>{incomingTrip?.pickupZone || '...'}</Text>
              </View>
              <View style={styles.routeArrow}>
                <Navigation size={14} color={COLORS.onSurfaceVariant} />
              </View>
              <View style={styles.incomingRouteBox}>
                <View style={[styles.incomingRouteDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.incomingRouteLabel}>{isRTL ? 'إلى' : 'To'}</Text>
                <Text style={styles.incomingRouteZone} numberOfLines={1}>{incomingTrip?.dropoffZone || '...'}</Text>
              </View>
            </View>

            {/* Fare */}
            <View style={[styles.incomingFare, isRTL && { flexDirection: 'row-reverse' }]}>
              <View>
                <Text style={styles.incomingFareLabel}>{isRTL ? 'الأجرة' : 'Fare'}</Text>
                <Text style={styles.incomingFareValue}>{t('sdg')} {incomingTrip?.fareEstimate?.toLocaleString() || '0'}</Text>
              </View>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
                <Text style={styles.acceptBtnText}>{isRTL ? 'قبول الطلب' : 'Accept'}</Text>
              </TouchableOpacity>
            </View>

            {/* Reject */}
            <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectTrip} activeOpacity={0.8}>
              <Text style={styles.rejectBtnText}>{isRTL ? 'رفض الطلب' : 'Reject'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==== Trip Summary Modal ==== */}
      <Modal visible={showTripSummary} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{isRTL ? '✅ نهاية الرحلة' : '✅ Trip Done'}</Text>
            
            {/* Total Fare Display */}
            <View style={styles.summaryFareBox}>
              <Text style={styles.summaryFareLabel}>{isRTL ? 'إجمالي الأجرة' : 'Total Fare'}</Text>
              <Text style={styles.summaryFareValue}>{t('sdg')} {(summaryData?.total || 0).toLocaleString()}</Text>
            </View>

            {/* Cash Input */}
            <Text style={[styles.cashInputLabel, isRTL && { textAlign: 'right' }]}>
              {isRTL ? 'المبلغ المستلم من الزبون' : 'Amount Received from Rider'}
            </Text>
            <TextInput
              style={[
                styles.cashInput,
                receivedCash && Number(receivedCash) >= (summaryData?.total || 0) && { borderColor: COLORS.primary }
              ]}
              placeholder={isRTL ? 'أدخل المبلغ...' : 'Enter amount...'}
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={receivedCash}
              onChangeText={setReceivedCash}
            />

            {receivedCash.length > 0 && (() => {
              const received = Number(receivedCash) || 0;
              const total = summaryData?.total || 0;
              const diff = received - total;
              const isExact = diff === 0;
              const isShort = diff < 0;
              const isOver = diff > 0;

              return (
                <View style={{ width: '100%', marginTop: 12 }}>
                  <View style={[
                    styles.cashStatusPill,
                    isExact && { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
                    isShort && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
                    isOver && { backgroundColor: '#EBF4FF', borderColor: '#BFDBFE' },
                  ]}>
                    <Text style={[
                      styles.cashStatusIcon,
                      isExact && { color: COLORS.success },
                      isShort && { color: COLORS.error },
                      isOver && { color: COLORS.primary },
                    ]}>
                      {isExact ? '✓' : isShort ? '!' : '+'}
                    </Text>
                    <Text style={[styles.cashStatusText, { color: '#1C1C1E' }]}>
                      {isExact
                        ? (isRTL ? 'المبلغ مطابق تماماً' : 'Exact amount received')
                        : isShort
                          ? (isRTL ? `ناقص ${t('sdg')} ${Math.abs(diff).toLocaleString()}` : `Short by ${t('sdg')} ${Math.abs(diff).toLocaleString()}`)
                          : (isRTL ? `الباقي: ${t('sdg')} ${diff.toLocaleString()}` : `Change: ${t('sdg')} ${diff.toLocaleString()}`)}
                    </Text>
                  </View>

                  {isOver && (
                    <View style={{ marginTop: 12 }}>
                      <TouchableOpacity 
                        style={[
                          styles.walletDepositBtn,
                          addChangeToWallet && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                        ]}
                        onPress={() => setAddChangeToWallet(!addChangeToWallet)}
                      >
                        <View style={[
                          styles.checkCircle,
                          addChangeToWallet && { backgroundColor: '#fff', borderColor: '#fff' }
                        ]}>
                          {addChangeToWallet && <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                        </View>
                        <View style={{ flex: 1, marginHorizontal: 12 }}>
                          <Text style={[styles.walletDepositTitle, addChangeToWallet && { color: '#fff' }, isRTL && { textAlign: 'right' }]}>
                            {isRTL ? `إيداع ${t('sdg')} ${diff.toLocaleString()} في محفظة الزبون` : `Deposit ${t('sdg')} ${diff.toLocaleString()} to rider wallet`}
                          </Text>
                          <Text style={[styles.walletDepositSub, addChangeToWallet && { color: 'rgba(255,255,255,0.7)' }, isRTL && { textAlign: 'right' }]}>
                            {isRTL ? `سيتم الإيداع تلقائياً للزبون (${activeTrip?.rider?.name || 'الراكب'})` : `Auto-deposit for rider (${activeTrip?.rider?.name || 'Rider'})`}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {addChangeToWallet && (
                        <View style={styles.walletDepositNote}>
                          <Text style={styles.walletDepositNoteText}>
                            {isRTL 
                              ? `سيتم إضافة ${t('sdg')} ${diff.toLocaleString()} لمحفظة الزبون وإشعاره برسالة.`
                              : `${t('sdg')} ${diff.toLocaleString()} will be added to rider's wallet with a notification.`}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {isShort && (
                    <View style={styles.shortWarning}>
                      <Text style={styles.shortWarningText}>
                        {isRTL 
                          ? `تنبيه: المبلغ أقل من الأجرة بـ ${t('sdg')} ${Math.abs(diff).toLocaleString()}. تأكد من استلام كامل المبلغ.`
                          : `Warning: Amount is ${t('sdg')} ${Math.abs(diff).toLocaleString()} short. Make sure to collect the full fare.`}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* Finalize Button */}
            <TouchableOpacity 
              style={[styles.finalizeBtn, { opacity: (!receivedCash || Number(receivedCash) <= 0) ? 0.5 : 1 }]} 
              onPress={finalizeTrip}
              disabled={!receivedCash || Number(receivedCash) <= 0}
              activeOpacity={0.85}
            >
              <Text style={styles.finalizeBtnText}>{isRTL ? 'تأكيد وإنهاء' : 'Confirm & Finish'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  map: { width, height },
  mapFallback: { flex: 1, backgroundColor: '#F1F5F9' },
  mapCenterDot: { position: 'absolute', top: '45%', left: '50%', marginLeft: -20 },
  mapCenterDotInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  driverMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#fff', ...SHADOWS.sm },
  mockCarOverlay: { position: 'absolute', zIndex: 5 },
  
  // Top Bar
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  wedoBrandPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    ...SHADOWS.md,
  },
  wedoBrandText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    ...SHADOWS.md,
  },
  statusBadgeOnline: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 13, fontWeight: '800', color: '#475569' },
  statusTextOnline: { color: '#166534' },

  // Welcome Banner
  welcomeBanner: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.lg,
    zIndex: 20,
  },
  welcomeBannerEmoji: { fontSize: 36, marginBottom: 8 },
  welcomeBannerTitle: { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5, marginBottom: 6 },
  welcomeBannerSub: { fontSize: 14, color: COLORS.onSurfaceVariant, fontWeight: '600', marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  welcomeBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    ...SHADOWS.md,
  },
  welcomeBannerBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  
  // FABs
  fabContainer: { position: 'absolute', right: 20, bottom: 40, gap: 12 },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  fabOnline: { backgroundColor: COLORS.success },
  
  // Demand
  demandLegend: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  legendTitle: { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  legendRadius: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '700' },
  radiusBar: { flexDirection: 'row', justifyContent: 'space-between' },
  radiusStep: { width: 40, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  radiusStepActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  radiusText: { fontSize: 12, color: '#475569', fontWeight: '700' },
  radiusTextActive: { color: '#fff', fontWeight: '800' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demandCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success },

  // Navigation Overlay
  navOverlayHeader: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    ...SHADOWS.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navDistance: { color: COLORS.primary, fontSize: 14, fontWeight: '900' },
  navRoadName: { color: '#1C1C1E', fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: -0.5 },
  navCarRing: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16,185,129,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.success },
  navCarDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: '#fff' },
  destinationBox: { backgroundColor: '#F59E0B', padding: 8, borderRadius: 12, borderWidth: 2, borderColor: '#fff' },

  // Active Trip Sheet
  activeSheetContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeTripAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  activeTripTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  activeTripSub: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  tripPhaseBadge: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tripPhaseText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  tripActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripActionSmall: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tripActionSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tripActionMain: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  tripActionMainText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },

  // Modal Overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  
  // Incoming Sheet
  incomingSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  incomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  incomingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  incomingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  countdownText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
  },
  countdownRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownRingText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.error,
  },

  incomingRoute: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 20,
  },
  incomingRouteBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  incomingRouteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  incomingRouteLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 4,
  },
  incomingRouteZone: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  routeArrow: {
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  incomingFare: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  incomingFareLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  incomingFareValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    ...SHADOWS.md,
  },
  acceptBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  rejectBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  rejectBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 14 },

  // Summary Modal
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  summaryCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.lg,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1C1E',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  summaryFareBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryFareLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryFareValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  cashInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  cashInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  cashStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  cashStatusIcon: {
    fontSize: 18,
    fontWeight: '900',
  },
  cashStatusText: {
    fontSize: 14,
    fontWeight: '800',
  },
  walletDepositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletDepositTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  walletDepositSub: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  walletDepositNote: {
    marginTop: 8,
    backgroundColor: '#EBF4FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  walletDepositNoteText: {
    fontSize: 11,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  shortWarning: {
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  shortWarningText: {
    fontSize: 11,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '700',
  },
  finalizeBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOWS.md,
  },
  finalizeBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 17,
  },
});
