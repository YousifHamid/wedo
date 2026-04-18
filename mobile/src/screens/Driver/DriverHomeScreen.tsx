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
          {isOnline && !activeTrip && nearbyCarPositions.map(car => (
            <View key={car.id} style={[styles.mockCarOverlay, { top: car.top as any, left: car.left as any }]}>
              <View style={[styles.driverMarker, { transform: [{ rotate: car.rot }], backgroundColor: '#555', width: 28, height: 28, borderRadius: 14 }]}>
                <Car color="#fff" size={12} />
              </View>
            </View>
          ))}
          {/* Driver Active Trip Nav View (Uber Style) */}
          {activeTrip && (
            <>
              {/* Simulate Turn-by-Turn Route */}
              <Polyline strokeColor={COLORS.primary} strokeWidth={6} lineDashPattern={undefined} />
              
              {/* Destination Point */}
              <Marker style={{ top: 120, left: 280 }}>
                <View style={styles.destinationBox}>
                  <MapPin color="#fff" size={14} />
                </View>
              </Marker>

              {/* Navigation Car Position */}
              <Marker style={{ top: 280, left: 160 }}>
                <View style={styles.navCarRing}>
                  <View style={styles.navCarDot} />
                </View>
              </Marker>

              {/* Uber Nav Header Overlay */}
              <View style={styles.navOverlayHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Navigation color="#fff" size={24} style={{ transform: [{rotate: '45deg'}], marginRight: 16 }} />
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

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}><Menu color="#FFFFFF" size={24} /></TouchableOpacity>
        <View style={[styles.statusBadge, isOnline && { backgroundColor: '#10B981', borderColor: '#059669' }]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#FFF' : '#000' }]} />
          <Text style={[styles.statusText, isOnline && { color: '#FFF' }]}>{isOnline ? t('online') : t('offline')}</Text>
        </View>
        <View style={styles.wedoBrandPill}>
          <Text style={styles.wedoBrandText}>Wedo</Text>
        </View>
      </View>

      {showDemandMap && (
        <View style={styles.demandLegend}>
          <View style={styles.rowBetween}>
            <Text style={styles.legendTitle}>{isRTL ? 'نطاق العمل واستقبال الطلبات' : 'Work & Request Radius'}</Text>
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
          <TouchableOpacity style={[styles.fab, showDemandMap && { backgroundColor: '#000' }]} onPress={() => setShowDemandMap(!showDemandMap)}><TrendingUp size={24} color="#FFFFFF" /></TouchableOpacity>
          <TouchableOpacity style={[styles.fab, isOnline && { backgroundColor: '#10B981', borderColor: '#059669' }]} onPress={handleToggleOnline}><Power size={24} color="#FFFFFF" /></TouchableOpacity>
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
            <Power size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.welcomeBannerBtnText}>{isRTL ? 'ابدأ استقبال الرحلات' : 'Start Receiving Trips'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTrip && (
        <SwipeableBottomSheet snapPoints={[400, 100]} initialSnapIndex={0} style={{ padding: 0 }}>
        <View style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 0 }}>
            {/* Top Dark Half */}
            <View style={[styles.sheetTopDark, { height: 180 }]}>
                <View style={[styles.sheetHeaderRow, isRTL && { flexDirection: 'row-reverse' }]}>
                   <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetMakeModel, isRTL && { textAlign: 'right' }]}>{isRTL ? 'رحلة جارية' : t('active_trip')}</Text>
                      <View style={[styles.sheetSubInfo, isRTL && { flexDirection: 'row-reverse' }]}>
                         <User size={12} color="#9CA3AF" style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }} />
                         <Text style={styles.sheetSubText}>{activeTrip?.rider?.name || 'Passenger'}</Text>
                      </View>
                   </View>
                </View>
                <Image 
                   source={{ uri: 'https://ui-avatars.com/api/?name=Rider&background=000&color=fff&size=128' }}
                   style={[styles.sheetCarImg, { width: 80, height: 80, borderRadius: 40, top: 30, right: 20 }, isRTL && { left: 20, right: undefined }]} 
                   resizeMode="contain" 
                />
            </View>

            {/* Bottom White Half */}
            <View style={[styles.sheetBottomWhite, { minHeight: 220 }]}>
               <Text style={[styles.sheetSectionTitle, isRTL && { textAlign: 'right' }]}>{isRTL ? 'إجراءات الكابتن' : 'Actions'}</Text>
               
               <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  <TouchableOpacity style={[styles.featureBox, { padding: 16, alignItems: 'center', flex: 1 }]} onPress={() => {}}>
                     <Navigation size={26} color="#111" />
                     <Text style={[styles.featureTitle, { marginTop: 8 }]}>{isRTL ? 'الخريطة' : 'Map'}</Text>
                  </TouchableOpacity>

                  {tripStep === 'arrived' && (
                    <TouchableOpacity style={[styles.sheetActionBtn, { flex: 2, paddingVertical: 24, alignItems: 'center' }]} onPress={() => setTripStep('started')}>
                        <Text style={styles.sheetActionText}>{isRTL ? 'بدء الرحلة' : 'Start Trip'}</Text>
                    </TouchableOpacity>
                  )}
                  {tripStep === 'started' && (
                    <TouchableOpacity style={[styles.sheetActionBtn, { flex: 2, paddingVertical: 24, alignItems: 'center', backgroundColor: '#111' }]} onPress={handleCompleteTrip}>
                        <Text style={styles.sheetActionText}>{isRTL ? 'إنهاء الرحلة' : 'Complete Trip'}</Text>
                    </TouchableOpacity>
                  )}
               </View>
            </View>
        </View>
        </SwipeableBottomSheet>
      )}

      <Modal visible={!!incomingTrip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: 'transparent', paddingHorizontal: 0 }}>
                {/* Top Dark Half */}
                <View style={[styles.sheetTopDark, { height: 230, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
                    <View style={[styles.sheetHeaderRow, isRTL && { flexDirection: 'row-reverse' }]}>
                       <View style={{ flex: 1 }}>
                          <Text style={[styles.sheetMakeModel, isRTL && { textAlign: 'right' }]}>{isRTL ? `طلب رحلة جديد` : t('new_trip_request')}</Text>
                          <View style={[styles.sheetSubInfo, isRTL && { flexDirection: 'row-reverse' }]}>
                             <Clock size={12} color="#9CA3AF" style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }} />
                             <Text style={styles.sheetSubText}>{countdown} {isRTL ? 'ث للقبول' : 's'}</Text>
                          </View>
                       </View>
                    </View>
                    <Image 
                       source={{ uri: 'https://ui-avatars.com/api/?name=New+Rider&background=000&color=fff&size=128' }}
                       style={[styles.sheetCarImg, { width: 90, height: 90, borderRadius: 45, top: 40, right: 28 }, isRTL && { left: 28, right: undefined }]} 
                       resizeMode="contain" 
                    />
                </View>

                {/* Bottom White Half */}
                <View style={[styles.sheetBottomWhite, { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 40 }]}>
                   <Text style={[styles.sheetSectionTitle, isRTL && { textAlign: 'right' }]}>{isRTL ? 'تفاصيل الوجهة' : 'Destination'}</Text>
                   
                   <View style={[styles.featuresGrid, { gap: 8, marginBottom: 24 }, isRTL && { flexDirection: 'row-reverse' }]}>
                      <View style={[styles.featureBox, { flex: 1, padding: 12 }]}>
                         <MapPin size={24} color="#111" />
                         <Text style={styles.featureTitle} numberOfLines={1}>{incomingTrip?.pickupZone || '...'}</Text>
                         <Text style={styles.featureSub}>{isRTL ? 'من' : 'From'}</Text>
                      </View>
                      <View style={[styles.featureBox, { flex: 1, padding: 12 }]}>
                         <Navigation size={24} color="#111" />
                         <Text style={styles.featureTitle} numberOfLines={1}>{incomingTrip?.dropoffZone || '...'}</Text>
                         <Text style={styles.featureSub}>{isRTL ? 'إلى' : 'To'}</Text>
                      </View>
                   </View>

                   <View style={[styles.sheetFooterRow, isRTL && { flexDirection: 'row-reverse' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                         <Text style={styles.sheetPrice}>${incomingTrip?.fareEstimate?.toLocaleString() || '0'}</Text>
                         <Text style={styles.sheetPriceSub}>/{isRTL ? 'الرحلة' : 'trip'}</Text>
                      </View>
                      
                      <TouchableOpacity style={[styles.sheetActionBtn, { paddingHorizontal: 24 }]} onPress={handleAccept} activeOpacity={0.8}>
                         <Text style={styles.sheetActionText}>{isRTL ? 'قبول الطلب' : 'Accept'}</Text>
                      </TouchableOpacity>
                   </View>

                   <TouchableOpacity style={styles.cancelTxtBtn} onPress={handleRejectTrip}>
                       <Text style={[styles.cancelTxtBtnText, { color: '#ef4444' }]}>{isRTL ? 'رفض الطلب' : 'Reject'}</Text>
                   </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      <Modal visible={showTripSummary} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}><View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{isRTL ? '✅ نهاية الرحلة' : '✅ Trip Done'}</Text>
          
          <View style={{ width: '100%', backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
            <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{isRTL ? 'إجمالي الأجرة' : 'Total Fare'}</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#000' }}>{t('sdg')} {(summaryData?.total || 0).toLocaleString()}</Text>
          </View>

          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', alignSelf: isRTL ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
            {isRTL ? 'المبلغ المستلم من الزبون' : 'Amount Received from Rider'}
          </Text>
          <TextInput
            style={{ width: '100%', backgroundColor: '#F9F9F9', borderRadius: 12, padding: 14, textAlign: 'center', fontSize: 22, fontWeight: 'bold', borderWidth: 2, borderColor: receivedCash ? (Number(receivedCash) >= (summaryData?.total || 0) ? '#000' : '#E5E7EB') : '#E5E7EB' }}
            placeholder={isRTL ? 'أدخل المبلغ...' : 'Enter amount...'}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, backgroundColor: isExact ? '#F3F4F6' : '#F3F4F6' }}>
                  <Text style={{ fontSize: 20, marginRight: 8, color: '#000' }}>{isExact ? '✔' : isShort ? '!' : '+'}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#000' }}>
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
                      style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: addChangeToWallet ? '#000' : '#F9F9F9', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: addChangeToWallet ? '#000' : '#E5E7EB' }}
                      onPress={() => setAddChangeToWallet(!addChangeToWallet)}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: addChangeToWallet ? '#FFF' : '#CCC', backgroundColor: addChangeToWallet ? '#000' : 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: isRTL ? 0 : 12, marginLeft: isRTL ? 12 : 0 }}>
                        {addChangeToWallet && <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: addChangeToWallet ? '#FFF' : '#000', textAlign: isRTL ? 'right' : 'left' }}>
                          {isRTL ? `إيداع ${t('sdg')} ${diff.toLocaleString()} في محفظة الزبون` : `Deposit ${t('sdg')} ${diff.toLocaleString()} to rider wallet`}
                        </Text>
                        <Text style={{ fontSize: 11, color: addChangeToWallet ? '#AAA' : '#6B7280', marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                          {isRTL ? `سيتم الإيداع تلقائياً للزبون (${activeTrip?.rider?.name || 'الراكب'})` : `Auto-deposit for rider (${activeTrip?.rider?.name || 'Rider'})`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {addChangeToWallet && (
                      <View style={{ marginTop: 8, backgroundColor: '#000', padding: 10, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: '#FFF', textAlign: 'center', fontWeight: '600' }}>
                          {isRTL 
                            ? `سيتم إضافة ${t('sdg')} ${diff.toLocaleString()} لمحفظة الزبون وإشعاره برسالة.`
                            : `${t('sdg')} ${diff.toLocaleString()} will be added to rider's wallet with a notification.`}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {isShort && (
                  <View style={{ marginTop: 8, backgroundColor: '#111', padding: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: '#FFF', textAlign: 'center', fontWeight: '600' }}>
                      {isRTL 
                        ? `تنبيه: المبلغ أقل من الأجرة بـ ${t('sdg')} ${Math.abs(diff).toLocaleString()}. تأكد من استلام كامل المبلغ.`
                        : `Warning: Amount is ${t('sdg')} ${Math.abs(diff).toLocaleString()} short. Make sure to collect the full fare.`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  map: { width, height },
  mapFallback: { flex: 1, backgroundColor: '#F8F9FA' },
  mapCenterDot: { position: 'absolute', top: '45%', left: '50%', marginLeft: -20 },
  mapCenterDotInner: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  driverMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  mockCarOverlay: { position: 'absolute', zIndex: 5 },
  topBar: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  wedoBrandPill: { backgroundColor: '#000000', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  wedoBrandText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  statusBadgeOnline: { borderColor: COLORS.success, backgroundColor: '#112211' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF' },
  statusTextOnline: { color: COLORS.success },

  // Welcome Banner (shown when driver is offline)
  welcomeBanner: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 20,
  },
  welcomeBannerEmoji: { fontSize: 36, marginBottom: 8 },
  welcomeBannerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 6 },
  welcomeBannerSub: { fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  welcomeBannerBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14, paddingHorizontal: 28,
    borderRadius: 50,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  welcomeBannerBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  fabContainer: { position: 'absolute', right: 20, bottom: 40, gap: 12 },
  fab: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  demandLegend: { position: 'absolute', top: 110, left: 20, right: 20, backgroundColor: '#1C1C1E', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  legendTitle: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  legendRadius: { fontSize: 12, color: '#FFFFFF', fontWeight: 'bold' },
  radiusBar: { flexDirection: 'row', justifyContent: 'space-between' },
  radiusStep: { width: 35, height: 30, borderRadius: 15, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  radiusStepActive: { backgroundColor: COLORS.success },
  radiusText: { fontSize: 11, color: '#FFFFFF', fontWeight: 'bold' },
  radiusTextActive: { color: '#000', fontWeight: '800' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demandCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success },
  activeSheetWrapper: { paddingHorizontal: 24, paddingBottom: 24 },
  activePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 8 },
  activeLabel: { fontSize: 12, fontWeight: '800', color: COLORS.success },
  activeActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  startTripSlide: { flex: 1, height: 50, backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: COLORS.success, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  slideLabel: { color: COLORS.success, fontWeight: '800' },
  completeTripBtn: { flex: 1, height: 50, backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: COLORS.error, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  completeTripBtnText: { color: COLORS.error, fontWeight: '800' },
  navBtnSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  requestCard: { backgroundColor: '#1C1C1E', padding: 24, paddingBottom: 40, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderColor: '#333' },
  requestTitle: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  tripDetailRow: { flexDirection: 'row', alignItems: 'center' },
  tripDetailLabel: { fontSize: 13, color: '#FFFFFF', marginBottom: 2, fontWeight: 'bold' },
  tripDetailAddress: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  routeDivider: { height: 20, width: 2, backgroundColor: '#333', marginLeft: 8, marginVertical: 4 },
  fareInfoValue: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 16 },
  acceptBtn: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 24, 
    alignItems: 'center', 
    marginBottom: 16,
    borderBottomWidth: 6,
    borderBottomColor: '#D1D5DB', // 3D Effect like Welcome screen!
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8
  },
  acceptBtnText: { color: '#000', fontWeight: '900', fontSize: 18 },
  rejectBtn: { 
    backgroundColor: '#1C1C1E', 
    padding: 16, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: '#333',
    borderBottomWidth: 6,
    borderBottomColor: '#000000', // Deep 3D Shadow
  },
  rejectBtnText: { color: '#ef4444', fontWeight: '900', fontSize: 16 },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalOptionText: { fontSize: 16, color: '#FFF', fontWeight: '800', marginLeft: 12 },
  modalCancelBtn: { marginTop: 12, padding: 16, backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#333', borderRadius: 16, alignItems: 'center' },
  
  // Uber Style Nav Overlay
  navOverlayHeader: { position: 'absolute', top: 90, left: 16, right: 16, backgroundColor: '#1C1C1E', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, flexDirection: 'row', alignItems: 'center' },
  navDistance: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  navRoadName: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 4 },
  navCarRing: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 255, 128, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.success },
  navCarDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: '#1C1C1E' },
  destinationBox: { backgroundColor: '#333', padding: 8, borderRadius: 12, borderWidth: 2, borderColor: '#FFF' },
  summaryCard: { width: '100%', backgroundColor: '#1C1C1E', borderWidth: 1, borderColor: '#333', borderRadius: 24, padding: 24, alignItems: 'center' },
  summaryTitle: { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 16 },
  finalizeBtn: { width: '100%', backgroundColor: '#FFF', padding: 16, borderRadius: 16, alignItems: 'center' },
  finalizeBtnText: { color: '#000', fontWeight: '900', fontSize: 18 },

  // New Interlocking Two-Tone Sheet Styles
  sheetTopDark: { backgroundColor: '#1C1C1E', height: 200, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 32, position: 'relative' },
  sheetHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetMakeModel: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  sheetSubInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  sheetSubText: { fontSize: 13, color: '#FFFFFF', fontWeight: '900' },
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
