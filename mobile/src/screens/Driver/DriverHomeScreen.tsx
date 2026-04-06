import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal, Alert, Keyboard, TextInput, Switch, Platform } from 'react-native';
import { Power, MapPin, Navigation, User, Bell, Wallet, Clock, Car, TrendingUp, Banknote, Layers, PlusCircle, Shield, Crown, X, ChevronRight, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { DISPATCH_COUNTDOWN } from '../../config/env';

// Safe Map Imports (Metro mocks in Expo Go, real in EAS builds)
import { SafeMapView as MapView, SafeMarker as Marker } from '../../components/MapViewMock';
const PROVIDER_GOOGLE = null;




const { width, height } = Dimensions.get('window');

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
    const { isServerEnabled } = useAuthStore.getState();
    if (!isServerEnabled) {
      const canReceiveNewTrip = (isOnline && !activeTrip && !incomingTrip) || 
                                 (isOnline && activeTrip && tripStep === 'started' && !incomingTrip);
      if (canReceiveNewTrip) {
        const delay = activeTrip ? 8000 : 5000;
        const timer = setTimeout(() => {
          setIncomingTrip({
            tripId: `mock_${Date.now()}`,
            pickupZone: activeTrip ? 'Arkaweet' : 'Khartoum North',
            dropoffZone: activeTrip ? 'Bahri Central' : 'Arkaweet',
            fareEstimate: activeTrip ? 3200 : 4500,
            rider: { name: activeTrip ? 'Ahmed Ali' : 'Mando Guest' },
            isQueuedTrip: !!activeTrip
          });
          setCountdown(DISPATCH_COUNTDOWN);
        }, delay);
        return () => clearTimeout(timer);
      }
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    socket.on('trip:incoming_request', (data: any) => {
      const canAccept = isOnline && (!activeTrip || (activeTrip && tripStep === 'started'));
      if (canAccept && !incomingTrip) {
        setIncomingTrip({ ...data, isQueuedTrip: !!activeTrip });
        setCountdown(DISPATCH_COUNTDOWN);
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
    
    // Build result message
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
    // Mock map — show driver's car + nearby cars when online
    const nearbyCarPositions = [
      { id: 'n1', top: '22%', left: '18%', rot: '25deg' },
      { id: 'n2', top: '30%', left: '68%', rot: '-20deg' },
      { id: 'n3', top: '62%', left: '35%', rot: '90deg' },
      { id: 'n4', top: '18%', left: '50%', rot: '-50deg' },
      { id: 'n5', top: '70%', left: '72%', rot: '140deg' },
    ];
    return (
      <View style={styles.mapFallback}>
        <MapView style={{ flex: 1 }}>
          {/* Nearby drivers visible when online and no active trip */}
          {isOnline && !activeTrip && nearbyCarPositions.map(car => (
            <View key={car.id} style={[styles.mockCarOverlay, { top: car.top as any, left: car.left as any }]}>
              <View style={[styles.driverMarker, { transform: [{ rotate: car.rot }], backgroundColor: '#555', width: 28, height: 28, borderRadius: 14 }]}>
                <Car color="#fff" size={12} />
              </View>
            </View>
          ))}
          {/* Driver's own car at center */}
          <View style={styles.mapCenterDot}>
            <View style={styles.mapCenterDotInner}>
              <Car color="#fff" size={14} />
            </View>
          </View>
        </MapView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}><User color={COLORS.onSurface} size={22} /></TouchableOpacity>
        <View style={[styles.statusBadge, isOnline && styles.statusBadgeOnline]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.primary : COLORS.onSurfaceVariant }]} />
          <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>{isOnline ? t('online') : t('offline')}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}><Bell color={COLORS.onSurface} size={22} /></TouchableOpacity>
      </View>

      {showDemandMap && (
        <View style={styles.demandLegend}>
          <View style={styles.rowBetween}>
            <Text style={styles.legendTitle}>{isRTL ? 'خريطة الطلب' : 'Demand Map'}</Text>
            <Text style={styles.legendRadius}>{demandRadius} km</Text>
          </View>
          <View style={[styles.radiusBar, { marginTop: 10 }]}>
            {[1, 2, 3, 5, 7].map(r => (
              <TouchableOpacity key={r} onPress={() => setDemandRadius(r)} style={[styles.radiusStep, demandRadius === r && styles.radiusStepActive]}>
                <Text style={[styles.radiusText, demandRadius === r && styles.radiusTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!activeTrip && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={[styles.fab, showDemandMap && { backgroundColor: COLORS.primary }]} onPress={() => setShowDemandMap(!showDemandMap)}><TrendingUp size={24} color={showDemandMap ? '#fff' : COLORS.onSurfaceVariant} /></TouchableOpacity>
          <TouchableOpacity style={[styles.fab, isOnline && { backgroundColor: COLORS.success }]} onPress={handleToggleOnline}><Power size={24} color={isOnline ? '#fff' : COLORS.onSurfaceVariant} /></TouchableOpacity>
        </View>
      )}

      {activeTrip && (
        <View style={styles.activeSheet}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={styles.activePulse} /><Text style={styles.activeLabel}>{isRTL ? 'رحلة جارية' : t('active_trip')}</Text>
          </View>
          <View style={styles.activeActions}>
            <TouchableOpacity style={styles.navBtnSmall}><Navigation color={COLORS.onSurfaceVariant} size={14} /></TouchableOpacity>
            {tripStep === 'arrived' && (
              <TouchableOpacity style={styles.startTripSlide} onPress={() => setTripStep('started')}><Text style={styles.slideLabel}>{isRTL ? 'بدء الرحلة' : 'Start Trip'}</Text></TouchableOpacity>
            )}
            {tripStep === 'started' && (
              <TouchableOpacity style={styles.completeTripBtn} onPress={handleCompleteTrip}><Text style={styles.completeTripBtnText}>{isRTL ? 'إنهاء الرحلة' : 'Complete Trip'}</Text></TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <Modal visible={!!incomingTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.requestCard}>
          <Text style={styles.requestTitle}>{isRTL ? `طلب رحلة جديد (${countdown}ث)` : `${t('new_trip_request')} (${countdown}s)`}</Text>
          <Text style={styles.fareInfoValue}>{t('sdg')} {incomingTrip?.fareEstimate}</Text>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}><Text style={styles.acceptBtnText}>{t('accept_trip')}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectTrip}><Text style={styles.rejectBtnText}>{t('reject_trip')}</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={showTripSummary} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}><View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{isRTL ? '✅ نهاية الرحلة' : '✅ Trip Done'}</Text>
          
          {/* Total Fare */}
          <View style={{ width: '100%', backgroundColor: '#f0fdf4', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: COLORS.onSurfaceVariant, marginBottom: 4 }}>{isRTL ? 'إجمالي الأجرة' : 'Total Fare'}</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.primary }}>{t('sdg')} {(summaryData?.total || 0).toLocaleString()}</Text>
          </View>

          {/* Amount Received Input */}
          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, alignSelf: isRTL ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
            {isRTL ? 'المبلغ المستلم من الزبون' : 'Amount Received from Rider'}
          </Text>
          <TextInput
            style={{ width: '100%', backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, textAlign: 'center', fontSize: 22, fontWeight: 'bold', borderWidth: 2, borderColor: receivedCash ? (Number(receivedCash) >= (summaryData?.total || 0) ? COLORS.success : '#ef4444') : '#e5e5e5' }}
            placeholder={isRTL ? 'أدخل المبلغ...' : 'Enter amount...'}
            keyboardType="numeric"
            value={receivedCash}
            onChangeText={setReceivedCash}
          />

          {/* Payment Analysis */}
          {receivedCash.length > 0 && (() => {
            const received = Number(receivedCash) || 0;
            const total = summaryData?.total || 0;
            const diff = received - total;
            const isExact = diff === 0;
            const isShort = diff < 0;
            const isOver = diff > 0;

            return (
              <View style={{ width: '100%', marginTop: 12 }}>
                {/* Status Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, backgroundColor: isExact ? '#f0fdf4' : isShort ? '#fef2f2' : '#fffbeb' }}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>{isExact ? '✅' : isShort ? '⚠️' : '💰'}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: isExact ? COLORS.success : isShort ? '#ef4444' : '#f59e0b' }}>
                    {isExact
                      ? (isRTL ? 'المبلغ مطابق تماماً' : 'Exact amount received')
                      : isShort
                        ? (isRTL ? `ناقص ${t('sdg')} ${Math.abs(diff).toLocaleString()}` : `Short by ${t('sdg')} ${Math.abs(diff).toLocaleString()}`)
                        : (isRTL ? `الباقي: ${t('sdg')} ${diff.toLocaleString()}` : `Change: ${t('sdg')} ${diff.toLocaleString()}`)}
                  </Text>
                </View>

                {/* Deposit Change to Rider Wallet */}
                {isOver && (
                  <View style={{ marginTop: 12 }}>
                    <TouchableOpacity 
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: addChangeToWallet ? '#e8f5e9' : '#f5f5f5', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: addChangeToWallet ? COLORS.success : '#e5e5e5' }}
                      onPress={() => setAddChangeToWallet(!addChangeToWallet)}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: addChangeToWallet ? COLORS.success : '#ccc', backgroundColor: addChangeToWallet ? COLORS.success : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}>
                        {addChangeToWallet && <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: COLORS.onSurface, textAlign: isRTL ? 'right' : 'left' }}>
                          {isRTL ? `إيداع ${t('sdg')} ${diff.toLocaleString()} في محفظة الزبون` : `Deposit ${t('sdg')} ${diff.toLocaleString()} to rider wallet`}
                        </Text>
                        <Text style={{ fontSize: 11, color: COLORS.onSurfaceVariant, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                          {isRTL ? `سيتم الإيداع تلقائياً للزبون (${activeTrip?.rider?.name || 'الراكب'})` : `Auto-deposit for rider (${activeTrip?.rider?.name || 'Rider'})`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {addChangeToWallet && (
                      <View style={{ marginTop: 8, backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: COLORS.success, textAlign: 'center', fontWeight: '600' }}>
                          {isRTL 
                            ? `💳 سيتم إضافة ${t('sdg')} ${diff.toLocaleString()} لمحفظة الزبون وإشعاره برسالة.`
                            : `💳 ${t('sdg')} ${diff.toLocaleString()} will be added to rider's wallet with a notification.`}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Short warning */}
                {isShort && (
                  <View style={{ marginTop: 8, backgroundColor: '#fef2f2', padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', fontWeight: '600' }}>
                      {isRTL 
                        ? `⚠️ المبلغ أقل من الأجرة بـ ${t('sdg')} ${Math.abs(diff).toLocaleString()}. تأكد من استلام كامل المبلغ.`
                        : `⚠️ Amount is ${t('sdg')} ${Math.abs(diff).toLocaleString()} short. Make sure to collect the full fare.`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

          {/* Confirm Button */}
          <TouchableOpacity 
            style={[styles.finalizeBtn, { marginTop: 16, opacity: (!receivedCash || Number(receivedCash) <= 0) ? 0.5 : 1 }]} 
            onPress={finalizeTrip}
            disabled={!receivedCash || Number(receivedCash) <= 0}
          >
            <Text style={styles.finalizeBtnText}>{isRTL ? 'تأكيد وإنهاء' : 'Confirm & Finish'}</Text>
          </TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  mapFallback: { flex: 1, backgroundColor: '#e8d5b8' },
  mapGrid: { flex: 1, opacity: 0.1 },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.primary },
  mapCenterDot: { position: 'absolute', top: '45%', left: '50%', marginLeft: -20 },
  mapCenterDotInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  driverMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  mockCarOverlay: { position: 'absolute', zIndex: 5 },
  topBar: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, ...SHADOWS.md },
  statusBadgeOnline: { backgroundColor: COLORS.success },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#666' },
  statusTextOnline: { color: '#fff' },
  fabContainer: { position: 'absolute', right: 20, bottom: 40, gap: 12 },
  fab: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg },
  demandLegend: { position: 'absolute', top: 110, left: 20, right: 20, backgroundColor: '#fff', padding: 16, borderRadius: 12, ...SHADOWS.md },
  legendTitle: { fontSize: 14, fontWeight: 'bold' },
  legendRadius: { fontSize: 12, color: COLORS.primary },
  radiusBar: { flexDirection: 'row', justifyContent: 'space-between' },
  radiusStep: { width: 35, height: 30, borderRadius: 15, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  radiusStepActive: { backgroundColor: COLORS.primary },
  radiusText: { fontSize: 11 },
  radiusTextActive: { color: '#fff' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demandCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.error },
  activeSheet: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, ...SHADOWS.lg },
  activePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 8 },
  activeLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.primary },
  activeActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  startTripSlide: { flex: 1, height: 48, backgroundColor: COLORS.success, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  slideLabel: { color: '#fff', fontWeight: 'bold' },
  completeTripBtn: { flex: 1, height: 48, backgroundColor: COLORS.success, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  completeTripBtnText: { color: '#fff', fontWeight: 'bold' },
  navBtnSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  requestCard: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  requestTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  fareInfoValue: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  acceptBtn: { backgroundColor: COLORS.success, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  acceptBtnText: { color: '#fff', fontWeight: 'bold' },
  rejectBtn: { padding: 8, alignItems: 'center' },
  rejectBtnText: { color: '#999' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  summaryCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  finalizeBtn: { width: '100%', backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  finalizeBtnText: { color: '#fff', fontWeight: 'bold' }
});
