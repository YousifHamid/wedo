import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, Keyboard, Alert, Animated, Platform } from 'react-native';
import * as Location from 'expo-location';
import useAuthStore from '../../store/useAuthStore';
import useTripStore from '../../store/useTripStore';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { ZONES as LOCAL_ZONES, ZoneItem, getZoneFare } from '../../constants/zones';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { Search, MapPin, Car, User, X, ChevronRight, ChevronLeft, Crown, Shield, Clock, Menu, Wallet, History, Banknote, CreditCard, Layers, PlusCircle, Navigation, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

import { SafeMapView as MapView, SafeMarker as Marker } from '../../components/MapViewMock';
import InteractiveMapMock from '../../components/InteractiveMapMock';


export default function UserHomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuthStore();
  const { vehicleType, setVehicleType, pickupZone, setPickupZone, dropoffZone, setDropoffZone, setFareEstimate, setTripStatus, stops, addStop, removeStop } = useTripStore();

  const [location, setLocation] = useState<any>(null);
  const [destination, setDestination] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [zones, setZones] = useState<ZoneItem[]>(LOCAL_ZONES);
  const [filteredZones, setFilteredZones] = useState<ZoneItem[]>([]);
  const [selectedDropoff, setSelectedDropoff] = useState<ZoneItem | null>(null);
  const [pinMode, setPinMode] = useState<'pickup' | 'destination' | null>(null);
  const [mapError, setMapError] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [routeStatus, setRouteStatus] = useState<'analyzing' | 'optimal' | null>(null);

  // Uber-style map interaction state (handled inside InteractiveMapMock)
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);

  const handleMapDragStart = useCallback(() => {
    setIsDragging(true);
    setHasDragged(true);
  }, []);

  const handleMapDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleConfirmMapPin = useCallback(() => {
    const addressStr = isRTL ? 'موقع محدد على الخريطة' : 'Selected map location';
    const customZone: ZoneItem = {
      _id: `custom_${Date.now()}`,
      name: addressStr,
      nameAr: `📍 ${addressStr}`,
      description: 'Pinned on map',
      descriptionAr: 'محدد عبر الخريطة'
    };
    setSelectedDropoff(customZone);
    setDropoffZone(customZone);
    setDestination(isRTL ? customZone.nameAr : customZone.name);
    setHasDragged(false);
  }, [isRTL, setDropoffZone]);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const response = await api.get('/zones');
        if (response.data && response.data.length > 0) {
          const apiZones: ZoneItem[] = response.data.map((z: any) => ({
            _id: z._id,
            name: z.name,
            nameAr: z.nameAr,
            description: z.description,
            descriptionAr: z.descriptionAr,
          }));
          setZones(apiZones);
          setPickupZone(apiZones[0]);
        }
      } catch (e) {
        console.log('[Wedo] Using local zones fallback');
      }
    };
    fetchZones();
  }, []);

  useEffect(() => {
    if (zones.length > 0) {
      setPickupZone(zones[0]);
    }
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        
        // Reverse geocode to get current address name
        const addressArray = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        if (addressArray && addressArray.length > 0) {
          const address = addressArray[0];
          const addressStr = address.street || address.name || address.city;
          if (addressStr) {
            setCurrentAddress(addressStr);
            setPickupZone({
              _id: 'current_loc',
              name: addressStr,
              nameAr: addressStr,
              description: 'Current Location',
              descriptionAr: 'موقعك الحالي'
            });
          }
        }
      } catch (e) {}
    })();
  }, []);

  // Initialize and move mock drivers
  useEffect(() => {
    const baseLat = location?.latitude || 15.5007;
    const baseLng = location?.longitude || 32.5599;
    
    const initialDrivers = Array.from({ length: 6 }).map((_, i) => ({
      id: `driver-${i}`,
      latitude: baseLat + (Math.random() - 0.5) * 0.02,
      longitude: baseLng + (Math.random() - 0.5) * 0.02,
      rotation: Math.random() * 360,
    }));
    setDrivers(initialDrivers);

    const interval = setInterval(() => {
      setDrivers(prev => prev.map(d => ({
        ...d,
        latitude: d.latitude + (Math.random() - 0.5) * 0.0002,
        longitude: d.longitude + (Math.random() - 0.5) * 0.0002,
        rotation: d.rotation + (Math.random() - 0.5) * 5,
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [location?.latitude]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (destination.trim().length > 0) {
        setShowSuggestions(true);
        const query = destination.toLowerCase();
        
        const localResults = zones.filter(z => {
          return z.name.toLowerCase().includes(query) || 
                 z.nameAr.includes(destination) || 
                 z.description?.toLowerCase().includes(query) ||
                 z.descriptionAr?.includes(destination);
        });

        if (destination.trim().length >= 3) {
           setIsSearchingMap(true);
           try {
              const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&countrycodes=sd&format=json&limit=5`);
              const data = await res.json();
              
              const mapResults = data.map((item: any) => ({
                 _id: `map_${item.place_id}`,
                 name: item.name || item.display_name.split(',')[0],
                 nameAr: item.name || item.display_name.split(',')[0],
                 description: '📍 ' + item.display_name,
                 descriptionAr: '📍 ' + item.display_name,
              }));

              setFilteredZones([...localResults, ...mapResults]);
           } catch(e) {
              setFilteredZones(localResults);
           } finally {
              setIsSearchingMap(false);
           }
        } else {
           setFilteredZones(localResults);
        }
      } else {
        setFilteredZones([]);
        setShowSuggestions(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchLocations();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [destination, zones]);

  const handleSelectDestination = async (zone: ZoneItem) => {
    if (selectedDropoff) {
      addStop(zone);
    } else {
      setSelectedDropoff(zone);
      setDropoffZone(zone);
      setRouteStatus('analyzing');
      setTimeout(() => setRouteStatus('optimal'), 2500);
    }
    setDestination(isRTL ? zone.nameAr : zone.name);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleRequestRide = async () => {
    if (!selectedDropoff) return;
    setTripStatus('searching');
    navigation.navigate('Searching');
  };

  const clearSearch = () => {
    setDestination('');
    setSelectedDropoff(null);
    setShowSuggestions(false);
    setRouteStatus(null);
  };

  const handleSelectType = async (type: 'standard' | 'premium' | 'shared') => {
    setVehicleType(type);
    if (selectedDropoff) {
      try {
        const pickupId = zones[0]._id;
        const response = await api.get(`/zones/pricing?from=${pickupId}&to=${selectedDropoff._id}`);
        // Pricing logic
      } catch (e) {
        let fare = getZoneFare(zones[0]._id, selectedDropoff._id, type === 'shared' ? 'standard' : type);
        if (type === 'shared') fare = fare * 0.6;
        setFareEstimate(fare);
      }
    }
  };

  const currentFare = selectedDropoff ? getZoneFare(zones[0]._id, selectedDropoff._id, vehicleType === 'shared' ? 'standard' : vehicleType) : 0;
  const standardFare = selectedDropoff ? getZoneFare(zones[0]._id, selectedDropoff._id, 'standard') : 0;
  const premiumFare = selectedDropoff ? getZoneFare(zones[0]._id, selectedDropoff._id, 'premium') : 0;
  const sharedFare = standardFare * 0.6;
  const finalFare = currentFare + (stops.length * 1500);

  const renderMap = () => {
    // Static positions for mock driver cars (scattered around center)
    const mockCarPositions = [
      { id: 1, top: '28%', left: '22%', rot: '30deg' },
      { id: 2, top: '35%', left: '65%', rot: '-15deg' },
      { id: 3, top: '55%', left: '40%', rot: '80deg' },
      { id: 4, top: '20%', left: '55%', rot: '-45deg' },
      { id: 5, top: '65%', left: '70%', rot: '120deg' },
    ];

    if (MapView && !mapError) {
      return (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{ latitude: 15.5007, longitude: 32.5599, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
            onRegionChangeComplete={(region: any) => {
               setLocation({ latitude: region.latitude, longitude: region.longitude });
            }}
            showsUserLocation={true}
          >
            {Marker && drivers.map(d => (
              <Marker key={d.id} coordinate={{ latitude: d.latitude, longitude: d.longitude }}>
                <View style={[styles.driverMarker, { transform: [{ rotate: `${d.rotation}deg` }] }]}>
                  <Car size={18} color="#fff" />
                </View>
              </Marker>
            ))}
          </MapView>
          {/* Uber-style floating pin on real map — static, no animation needed */}
          {!selectedDropoff && (
            <View style={styles.uberPinContainer} pointerEvents="none">
              <MapPin size={52} color={COLORS.primary} strokeWidth={2} />
            </View>
          )}
          <TouchableOpacity style={styles.gpsBtn} onPress={() => Alert.alert(isRTL ? 'تحديد الموقع' : 'Getting Location')}>
            <Navigation color={COLORS.primary} size={20} />
          </TouchableOpacity>
        </View>
      );
    }
    // ── Mock map: use InteractiveMapMock with full pan + pinch-zoom ──
    const mockDrivers = [
      { id: 'd1', top: '28%', left: '22%', rot: '30deg' },
      { id: 'd2', top: '35%', left: '65%', rot: '-15deg' },
      { id: 'd3', top: '55%', left: '40%', rot: '80deg' },
      { id: 'd4', top: '20%', left: '55%', rot: '-45deg' },
      { id: 'd5', top: '65%', left: '70%', rot: '120deg' },
    ];
    return (
      <View style={styles.mapContainer}>
        <InteractiveMapMock
          style={StyleSheet.absoluteFill}
          drivers={!selectedDropoff ? mockDrivers : []}
          onDragStart={handleMapDragStart}
          onDragEnd={handleMapDragEnd}
        />
        {/* GPS button */}
        <TouchableOpacity style={styles.gpsBtn} onPress={() => {}}>
          <Navigation color={COLORS.primary} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}

      {/* Top bar — hidden while dragging */}
      {!selectedDropoff && !isDragging && (
        <View style={[styles.topBar, { top: insets.top + 10 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
            <Menu color={COLORS.onSurface} size={22} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.brandText}>Wedo</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
            <User color={COLORS.onSurface} size={22} />
          </TouchableOpacity>
        </View>
      )}

      {selectedDropoff && (
         <View style={[styles.floatingRouteContainer, { top: insets.top + 10 }]}>
           <View style={[styles.floatingRouteCard, isRTL && { flexDirection: 'row-reverse' }]}>
             <TouchableOpacity style={{ padding: 8 }} onPress={clearSearch}>
               {isRTL ? <ChevronRight size={24} color={COLORS.onSurface} /> : <ArrowLeft size={24} color={COLORS.onSurface} />}
             </TouchableOpacity>
             <View style={{ flex: 1, paddingHorizontal: 16 }}>
               <Text style={[styles.floatingRouteText, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                 {isRTL ? selectedDropoff.nameAr : selectedDropoff.name}
               </Text>
             </View>
           </View>
         </View>
      )}

      {/* Note: pin is rendered inside InteractiveMapMock for mock map.
           For real maps above, the static pin above handles it. */}

      {/* Confirm pin location — floats above bottom sheet when dragged */}
      {!selectedDropoff && hasDragged && !isDragging && (
        <View style={styles.confirmPinFloating}>
          <TouchableOpacity style={styles.confirmPinBtn} onPress={handleConfirmMapPin} activeOpacity={0.88}>
            <MapPin size={18} color="#fff" />
            <Text style={[styles.confirmPinText, { marginLeft: 8 }]}>
              {isRTL ? 'تأكيد هذا الموقع' : 'Confirm this location'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom sheet — hidden when dragging for full map UX */}
      {!isDragging && (
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        {!selectedDropoff ? (
          <>
            <View style={[styles.pickupBar, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.pickupDot} />
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={[styles.pickupLabel, isRTL && { textAlign: 'right' }]}>{isRTL ? 'مكان الانطلاق' : 'Pickup From'}</Text>
                <Text style={[styles.pickupValue, isRTL && { textAlign: 'right' }]}>{currentAddress ? `📍 ${currentAddress}` : (isRTL ? '📍 موقعك الحالي' : 'Current Location')}</Text>
              </View>
              <MapPin size={22} color={COLORS.success} />
            </View>

            <View style={[styles.pickupBar, { marginTop: -10 }, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.pickupDot, { backgroundColor: COLORS.primary }]} />
              <TextInput
                placeholder={isRTL ? 'إلى أين تريد الذهاب؟' : 'Where to?'}
                style={[{ flex: 1, marginHorizontal: 12, fontSize: 18, fontWeight: 'bold' }, isRTL && { textAlign: 'right' }]}
                value={destination}
                onChangeText={(val) => { setDestination(val); setShowSuggestions(true); }}
                textAlign={isRTL ? 'right' : 'left'}
              />
              <Search size={20} color={COLORS.primary} />
            </View>

            {showSuggestions && destination.length > 0 && (
              <View style={{ maxHeight: 200 }}>
                {filteredZones.map((zone) => (
                  <TouchableOpacity key={zone._id} style={[styles.suggestionItem, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => handleSelectDestination(zone)}>
                    <MapPin color={COLORS.primary} size={16} />
                    <Text style={[{ marginHorizontal: 10 }, isRTL && { textAlign: 'right' }]}>{isRTL ? zone.nameAr : zone.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Hint: drag pin on map */}
            {!hasDragged && !showSuggestions && (
              <View style={styles.dragHintRow}>
                <Text style={[styles.dragHintText, isRTL && { textAlign: 'right' }]}>
                  {isRTL ? '💡 حرّك الخريطة لتحديد الوجهة مباشرة' : '💡 Drag the map to set destination'}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View>
            <TouchableOpacity style={[styles.vehicleRow, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => handleSelectType('standard')}>
               <Car color={COLORS.primary} size={30} />
               <View style={{ flex: 1, marginHorizontal: 12 }}>
                 <Text style={[{ fontWeight: 'bold' }, isRTL && { textAlign: 'right' }]}>{isRTL ? 'عادية' : 'Standard'}</Text>
                 <Text style={[{ fontSize: 12, color: COLORS.onSurfaceVariant }, isRTL && { textAlign: 'right' }]}>{isRTL ? '4 دقائق' : '4 min away'}</Text>
               </View>
               <Text style={{ fontWeight: 'bold' }}>{standardFare} SDG</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.requestMainBtn} onPress={handleRequestRide}>
              <Text style={styles.requestMainText}>{isRTL ? 'اطلب الرحلة الآن' : 'Request Ride'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  map: { width, height },
  mapContainer: { flex: 1 },
  mapFallback: { flex: 1, backgroundColor: '#e8d5b8', justifyContent: 'center', alignItems: 'center' },
  mapCenterDot: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mapCenterDotInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#fff' },
  mapCenterDotRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, opacity: 0.15 },
  gpsBtn: { position: 'absolute', right: 20, bottom: 350, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.md },
  brandText: { fontSize: 24, fontWeight: '900', color: '#000' },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, ...SHADOWS.lg },
  pickupBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, padding: 16, borderRadius: 12, marginBottom: 16 },
  pickupDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  pickupLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.onSurfaceVariant },
  pickupValue: { fontSize: 16, fontWeight: 'bold' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mapPinSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16 },
  mapPinSelectorText: { marginLeft: 8, fontWeight: 'bold', color: COLORS.primary },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.surfaceContainerLow, borderRadius: 12, marginBottom: 16 },
  requestMainBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 12, alignItems: 'center' },
  requestMainText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  pinBottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  confirmPinText: { color: '#fff', fontWeight: 'bold' },
  cancelPinBtn: { alignItems: 'center' },
  cancelPinText: { color: COLORS.onSurfaceVariant },
  centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -48, zIndex: 10 },
  driverMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  floatingRouteContainer: { position: 'absolute', left: 16, right: 16, zIndex: 10 },
  floatingRouteCard: { backgroundColor: '#fff', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', ...SHADOWS.md },
  floatingRouteText: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  // Map overlay elements
  mockCarMarker: { position: 'absolute', zIndex: 5 },
  dropPinShadow: { width: 20, height: 6, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'center', marginTop: -4 },
  // Uber-style always-on pin
  uberPinWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 20, pointerEvents: 'none' as any },
  uberPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -52, zIndex: 20 },
  pinShadowDot: { width: 16, height: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.25)', alignSelf: 'center', position: 'absolute', top: '50%', left: '50%', marginLeft: -8, marginTop: -4, zIndex: 19 },
  confirmPinFloating: { position: 'absolute', bottom: 310, left: 20, right: 20, zIndex: 25 },
  confirmPinBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 12, ...SHADOWS.md },
  dragHintRow: { paddingTop: 8, paddingBottom: 4 },
  dragHintText: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
});
