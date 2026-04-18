import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, Keyboard, Alert, Animated, Platform, Image, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import useAuthStore from '../../store/useAuthStore';
import useTripStore from '../../store/useTripStore';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { ZONES as LOCAL_ZONES, ZoneItem, getZoneFare } from '../../constants/zones';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { Search, MapPin, Car, User, X, ChevronRight, ChevronLeft, Crown, Shield, Clock, Menu, Wallet, History, Banknote, CreditCard, Layers, PlusCircle, Navigation, ArrowLeft, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

import { SafeMapView as MapView, SafeMarker as Marker, SafePolyline as Polyline } from '../../components/MapViewMock';
import { DARK_MAP_STYLE } from '../../constants/mapStyle';
import InteractiveMapMock from '../../components/InteractiveMapMock';
import SwipeableBottomSheet from '../../components/SwipeableBottomSheet';


export default function UserHomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuthStore();
  const { vehicleType, setVehicleType, pickupZone, setPickupZone, dropoffZone, setDropoffZone, setFareEstimate, setTripStatus, stops, addStop, removeStop } = useTripStore();

  const [dashboardMode, setDashboardMode] = useState(false); // Boot directly into Map!
  const [location, setLocation] = useState<any>(null);
  const [destination, setDestination] = useState('');
  const [pickup, setPickup] = useState('');
  const [editingPickup, setEditingPickup] = useState(false);
  const [bookingMode, setBookingMode] = useState<'now' | 'later'>('now');
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
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

  const handleScheduleLater = () => {
    Alert.alert(
      isRTL ? '📅 جدولة رحلة' : '📅 Schedule a Ride',
      isRTL
        ? 'سيتم تطبيق ميزة الجدولة قريباً. هل تريد المتابعة بطلب فوري؟'
        : 'Scheduled rides are coming soon. Would you like to request now instead?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: isRTL ? 'اطلب الآن' : 'Book Now', onPress: () => { setBookingMode('now'); handleRequestRide(); } }
      ]
    );
  };

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
            setPickup(addressStr); // Sync the editable pickup field
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

  // Mock drivers removed for production
  useEffect(() => {
    // Sockets for live nearby drivers can be implemented here later
  }, []);

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
            style={StyleSheet.absoluteFill}
            customMapStyle={DARK_MAP_STYLE}
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
        {/* Background Image (Scenic Traffic View) */}
        <Image 
           source={{ uri: 'https://images.unsplash.com/photo-1515166099120-d125dbb2c9fc?q=80&w=1470&auto=format&fit=crop' }}
           style={StyleSheet.absoluteFill}
           resizeMode="cover"
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.25)' }]} />

        {/* Transparent Interactive Map Handler */}
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

  const renderLuxuryDashboard = () => {
    return (
      <View style={[styles.container, { backgroundColor: '#181A1F' }]}>
         <Image 
           source={{ uri: 'https://images.unsplash.com/photo-1682687982501-1e58f813f22b?q=80&w=1470&auto=format&fit=crop' }} 
           style={StyleSheet.absoluteFill}
           resizeMode="cover"
         />
         <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
         <View style={[styles.luxuryHeader, { paddingTop: Math.max(insets.top, 20) }, isRTL && { flexDirection: 'row-reverse' }]}>
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={{ width: 80, height: 36, resizeMode: 'contain' }}
                />
             </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.luxuryAvatarBtn}>
               <User color="#FFF" size={20} />
            </TouchableOpacity>
         </View>

         <View style={styles.luxuryCarContainer}>
            {/* Massive Front-Facing Luxury SUV */}
            <Image 
               source={{ uri: 'https://purepng.com/public/uploads/large/purepng.com-black-toyota-fortuner-carcarvehicletransporttoyotafortuner-961524671409zmbhm.png' }}
               style={styles.luxuryCarHero}
               resizeMode="contain"
            />
         </View>

         <View style={[styles.luxuryTextWrapper, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.luxuryHeadline, { textAlign: isRTL ? 'right' : 'left' }]}>
               {isRTL ? 'سيارات فخمة.\nاستمتع بالرفاهية' : 'Premium cars.\nEnjoy the luxury'}
            </Text>
            <Text style={[styles.luxurySub, { textAlign: isRTL ? 'right' : 'left', color: '#E5E7EB' }]}>
               {isRTL ? 'استمتار ورفاهية لا تضاهى للإيجار اليومي.\nعش إثارة القيادة بأفضل الأسعار.' : 'Premium and prestige car daily rental.\nExperience the thrill at a lower price.'}
            </Text>
            
            <TouchableOpacity style={styles.luxuryBtn} activeOpacity={0.8} onPress={() => setDashboardMode(false)}>
               <Text style={styles.luxuryBtnText}>{isRTL ? 'هيا بنا' : "Let's Go"}</Text>
            </TouchableOpacity>
         </View>
      </View>
    );
  };

  if (dashboardMode) {
    return renderLuxuryDashboard();
  }

  return (
    <View style={styles.container}>
      {renderMap()}

      {/* Floating Premium Header */}
      {!selectedDropoff && !isDragging && (
        <View style={[styles.floatingHeader, { top: Math.max(insets.top, 20) }, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.leftNavGroup, isRTL && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity style={styles.menuBtn} onPress={() => setDashboardMode(true)} activeOpacity={0.8}>
               {isRTL ? <ChevronRight color="#000" size={24} /> : <ChevronLeft color="#000" size={24} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
              <Menu color="#000" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.brandContainer}>
            <Text style={styles.brandWordmark}>Wedo</Text>
          </View>
        </View>
      )}

      {/* Enhanced Floating Trip Details Header — with prominent back button */}
      {selectedDropoff && !isDragging && (
         <View style={[styles.enhancedRouteContainer, { top: Math.max(insets.top, 16) }]}>
           <View style={styles.enhancedRouteCard}>
             <View style={styles.enhancedRouteLeft}>
               <TouchableOpacity style={styles.enhancedBackBtn} onPress={clearSearch} activeOpacity={0.8}>
                 {isRTL ? <ChevronRight size={24} color="#1C1C1E" /> : <ChevronLeft size={24} color="#1C1C1E" />}
               </TouchableOpacity>
             </View>

             <View style={styles.enhancedRouteContent}>
               <View style={styles.enhancedTimeline}>
                 <View style={styles.enhancedTimelineCircle} />
                 <View style={styles.enhancedTimelineLine} />
                 <View style={styles.enhancedTimelineSquare} />
               </View>
               <View style={styles.enhancedLocations}>
                 <Text style={[styles.enhancedPickupText, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                   {pickupZone?.name || pickup || (isRTL ? 'الموقع الحالي' : 'Current Location')}
                 </Text>
                 <View style={styles.enhancedDivider} />
                 <Text style={[styles.enhancedDropoffText, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                   {isRTL ? selectedDropoff.nameAr : selectedDropoff.name}
                 </Text>
               </View>
             </View>
           </View>

           {/* Clear/Back pill below the card */}
           <TouchableOpacity
             style={[styles.clearDestBtn, isRTL && { alignSelf: 'flex-start' }]}
             onPress={clearSearch}
             activeOpacity={0.8}
           >
             <X size={14} color="#FFF" />
             <Text style={styles.clearDestBtnText}>{isRTL ? 'تغيير الوجهة' : 'Change Destination'}</Text>
           </TouchableOpacity>
         </View>
      )}

      {/* Interactive Swipeable Bottom Sheet */}
      {!isDragging && (
      <SwipeableBottomSheet 
         snapPoints={selectedDropoff ? [height * 0.75] : [height * 0.52, 240]} 
         initialSnapIndex={0}
         style={{ paddingBottom: Math.max(insets.bottom, 16), padding: selectedDropoff ? 0 : undefined, overflow: 'hidden' }}
      >
        {!selectedDropoff ? (
          <View style={styles.sheetContent}>
             <Text style={[styles.greetingText, isRTL && { textAlign: 'right' }]}>{isRTL ? 'إلى أين الوجهة؟' : 'Where to?'}</Text>
             
             <View style={[styles.searchContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                <View style={[styles.timeline, isRTL ? { marginRight: 0, marginLeft: 16 } : { marginRight: 16 }]}>
                   <View style={styles.timelineDotStart} />
                   <View style={styles.timelineLine} />
                   <View style={styles.timelineDotEnd} />
                </View>
                
                <View style={styles.inputsColumn}>
                   {/* Editable Pickup Field */}
                   <TouchableOpacity
                     style={styles.inputBox}
                     onPress={() => setEditingPickup(true)}
                     activeOpacity={0.7}
                   >
                     {editingPickup ? (
                       <TextInput
                         style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
                         autoFocus
                         placeholder={isRTL ? 'ابحث عن نقطة انطلاق...' : 'Search pickup location...'}
                         placeholderTextColor="#9ca3af"
                         value={pickup}
                         onChangeText={(val) => {
                           setPickup(val);
                           // Update pickup zone with custom text
                           setPickupZone({ _id: 'custom_pickup', name: val, nameAr: val, description: '', descriptionAr: '' });
                         }}
                         onBlur={() => setEditingPickup(false)}
                       />
                     ) : (
                       <View style={[styles.pickupRow, isRTL && { flexDirection: 'row-reverse' }]}>
                         <Text style={[styles.inputLabelPlaceholder, isRTL && { textAlign: 'right' }, { flex: 1 }]} numberOfLines={1}>
                           {pickup || (isRTL ? 'الموقع الحالي' : 'Current Location')}
                         </Text>
                         <View style={styles.editPickupBadge}>
                           <Text style={styles.editPickupText}>{isRTL ? 'تغيير' : 'Edit'}</Text>
                         </View>
                       </View>
                     )}
                   </TouchableOpacity>

                   <View style={styles.divider} />

                   {/* Destination Input + suggestions inline */}
                   <View style={styles.inputBoxActive}>
                     <TextInput
                       placeholder={isRTL ? 'حدد وجهتك المراد الزهاب اليها' : 'Find a destination...'}
                       placeholderTextColor="#9ca3af"
                       style={[styles.searchInput, isRTL && { textAlign: 'right' }]}
                       value={destination}
                       onChangeText={(val) => { setDestination(val); setShowSuggestions(true); }}
                     />
                   </View>

                   {/* Suggestions — appear inside the search card as a dropdown */}
                   {showSuggestions && destination.length > 0 && filteredZones.length > 0 && (
                     <View style={styles.inlineSuggestionsWrapper}>
                       {filteredZones.slice(0, 6).map((zone) => (
                         <TouchableOpacity
                           key={zone._id}
                           style={[styles.inlineSuggestionRow, isRTL && { flexDirection: 'row-reverse' }]}
                           onPress={() => handleSelectDestination(zone)}
                           activeOpacity={0.7}
                         >
                           <View style={styles.suggestionIconBg}>
                             <MapPin color={COLORS.primary} size={16} />
                           </View>
                           <View style={[styles.suggestionTextWrapper, isRTL ? { paddingRight: 10, alignItems: 'flex-end' } : { paddingLeft: 10, alignItems: 'flex-start' }]}>
                             <Text style={styles.suggestionTitle} numberOfLines={1}>{isRTL ? zone.nameAr : zone.name}</Text>
                             <Text style={styles.suggestionSubtitle} numberOfLines={1}>{zone.description || (isRTL ? 'السودان' : 'Sudan')}</Text>
                           </View>
                         </TouchableOpacity>
                       ))}
                     </View>
                   )}
                </View>
             </View>

            {/* Book Now Button — always visible */}
            {!showSuggestions && (
              <TouchableOpacity
                style={styles.bookNowPill}
                activeOpacity={0.85}
                onPress={() => {}}
              >
                <Text style={styles.bookNowPillText} numberOfLines={1} allowFontScaling={false}>
                  {isRTL ? 'اطلب الان' : 'Book Now'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.sheetContentMockup}>
            {/* FULL DETAILS — visible entirely in one clear view */}
            <View style={{ flex: 1, padding: 16 }}>
              {/* Selected Car Card */}
              <View style={[styles.mockupMainCard, vehicleType === 'premium' && styles.mockupMainCardPremium]}>
                 <View style={[styles.mockupHeaderRow, isRTL && { flexDirection: 'row-reverse' }, { marginBottom: 8 }]}>
                    <Text style={[styles.mockupMainTitle, vehicleType === 'premium' && { color: '#E5E7EB' }]}>{isRTL ? 'السيارة المختارة' : 'RECOMMENDED RIDE'}</Text>
                     <View style={styles.etaBadge}>
                        <Clock size={12} color="#000" style={{ marginRight: 4 }} />
                        <Text style={styles.etaBadgeText}>{isRTL ? 'وقت الوصول 3 دقائق' : '3 min arrival'}</Text>
                     </View>
                 </View>
                 <View style={[styles.carInfoCompactRow, isRTL && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.carVisualColumn}>
                        <Image
                           source={{ uri: vehicleType === 'premium'
                              ? 'https://purepng.com/public/uploads/large/purepng.com-black-toyota-fortuner-carcarvehicletransporttoyotafortuner-961524671409zmbhm.png'
                              : 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png'
                           }}
                           style={styles.smallCarImg}
                           resizeMode="contain"
                        />
                        <View style={styles.licensePlate}>
                           <Text style={styles.licensePlateText}>{isRTL ? '1234 - خ ر أ' : '1234 - KRA'}</Text>
                        </View>
                    </View>
                    <View style={[styles.carTextColumn, isRTL ? { paddingRight: 16, alignItems: 'flex-end' } : { paddingLeft: 16, alignItems: 'flex-start' }]}>
                       <Text style={[styles.mockupMainNameCompact, isRTL && { textAlign: 'right' }, vehicleType === 'premium' && { color: '#FFF' }]}>{vehicleType === 'premium' ? (isRTL ? 'ويدو مميز' : 'Wedo VIP') : (isRTL ? 'ويدو كلاسيك' : 'Wedo Classic')}</Text>
                       <View style={[styles.mockupMainSubRow, isRTL && { flexDirection: 'row-reverse' }, { marginTop: 4 }]}>
                          <Navigation size={12} color={vehicleType === 'premium' ? '#9CA3AF' : '#6B7280'} style={isRTL ? {marginLeft: 4} : {marginRight: 4}} />
                          <Text style={[styles.mockupMainSubText, vehicleType === 'premium' && { color: '#9CA3AF' }]}>{isRTL ? '~ 2.5 كم' : '~ 2.5 km'}    {vehicleType === 'premium' ? '💎 Luxury' : '🍃 Eco'}</Text>
                       </View>
                       <Text style={[styles.mockupMainPriceCompact, vehicleType === 'premium' && { color: '#FFF' }, { marginTop: 8 }]}>
                          {(vehicleType === 'premium' ? premiumFare : standardFare).toLocaleString()}
                          <Text style={[styles.mockupMainPriceSub, vehicleType === 'premium' && { color: '#9CA3AF' }]}> {isRTL ? 'SDG' : 'sdg'}</Text>
                       </Text>
                    </View>
                 </View>
               </View>

               {/* ── Vehicle Type Selector: عادي / مميز ── */}
               <View style={styles.vehicleTypeRow}>
                  <TouchableOpacity
                    style={[styles.vehicleTypeBtn, vehicleType !== 'premium' && styles.vehicleTypeBtnActive]}
                    onPress={() => handleSelectType('standard')}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.vehicleTypeBtnLabel, vehicleType !== 'premium' && { color: '#000', fontWeight: '900' }]}>
                      {isRTL ? 'عادي' : 'Standard'}
                    </Text>
                    <Text style={[styles.vehicleTypeBtnPrice, vehicleType !== 'premium' && { color: '#333' }]}>
                      {standardFare.toLocaleString()} SDG
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.vehicleTypeBtn, vehicleType === 'premium' && styles.vehicleTypeBtnActivePremium]}
                    onPress={() => handleSelectType('premium')}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.vehicleTypeBtnLabel, vehicleType === 'premium' && { color: '#fff', fontWeight: '900' }]}>
                      {isRTL ? 'مميز' : 'Premium'}
                    </Text>
                    <Text style={[styles.vehicleTypeBtnPrice, vehicleType === 'premium' && { color: '#D1FAE5' }]}>
                      {premiumFare.toLocaleString()} SDG
                    </Text>
                  </TouchableOpacity>
               </View>

               {/* ── Confirm Booking ── */}
               <TouchableOpacity
                 style={styles.mockupBookBtn}
                 onPress={bookingMode === 'now' ? handleRequestRide : handleScheduleLater}
                 activeOpacity={0.88}
               >
                 <Text style={styles.mockupBookBtnText} numberOfLines={1} adjustsFontSizeToFit>
                   {isRTL ? 'اكمل حجز رحلتك' : 'Confirm & Book Ride'}
                 </Text>
               </TouchableOpacity>

            </View>
          </View>
        )}
      </SwipeableBottomSheet>
      )}

      {/* Floating Map Drag Confirm Button */}
      {!selectedDropoff && hasDragged && !isDragging && (
        <View style={[styles.confirmPinFloating, { bottom: 430 }]}>
          <TouchableOpacity style={styles.confirmMapBtn} onPress={handleConfirmMapPin} activeOpacity={0.9}>
             <Text style={styles.confirmMapBtnText}>{isRTL ? 'تأكيد موقع الانطلاق' : 'Confirm Pickup'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  map: { width, height },
  mapContainer: { flex: 1 },
  mapFallback: { flex: 1, backgroundColor: '#e8ecef', justifyContent: 'center', alignItems: 'center' },
  mapGrid: { opacity: 0 },
  mapCenterDot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  mapCenterDotInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#fff' },
  
  gpsBtn: { position: 'absolute', right: 20, bottom: 350, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.lg },
  
  // Premium Header
  floatingHeader: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  leftNavGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  langPill: { backgroundColor: '#1A1B1F', paddingHorizontal: 16, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  langPillText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  
  brandContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000000', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, ...SHADOWS.sm },
  brandLogo: { width: 34, height: 34, resizeMode: 'contain', borderRadius: 6 },
  brandWordmark: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  brandTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, marginLeft: 8 },
  
  // Floating Search Pill
  floatingRouteContainer: { position: 'absolute', left: 16, right: 16, zIndex: 10 },
  pillCard: { backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', ...SHADOWS.lg },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' },
  pillTextContainer: { flex: 1, paddingHorizontal: 16 },
  pillText: { fontSize: 16, fontWeight: '700', color: COLORS.onSurface },

  // Premium Bottom Sheet (Using Swipeable Wrapper, so only overrides needed)
  sheetContent: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 },
  greetingText: { fontSize: 22, fontWeight: '900', color: COLORS.onSurface, marginBottom: 16, letterSpacing: -0.5 },
  
  // "اطلب الان" pill — centered, always visible white text on black
  bookNowPill: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#000000', 
    borderRadius: 50, 
    paddingVertical: 18, 
    paddingHorizontal: 24, 
    marginTop: 12,
    minHeight: 56,
  },
  bookNowPillText: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  bookNowCarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginLeft: 8 },
  
  searchContainer: { flexDirection: 'row', backgroundColor: '#f9fafb', borderRadius: 20, padding: 16, marginBottom: 16 },
  timeline: { width: 20, alignItems: 'center', paddingVertical: 8 },
  timelineDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.onSurfaceVariant },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  timelineDotEnd: { width: 10, height: 10, borderRadius: 0, backgroundColor: COLORS.primary },
  
  inputsColumn: { flex: 1 },
  inputBox: { height: 40, justifyContent: 'center' },
  inputLabelPlaceholder: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  inputBoxActive: { height: 40, justifyContent: 'center' },
  searchInput: { fontSize: 14, fontWeight: '700', color: COLORS.onSurface, padding: 0 },

  suggestionsWrapper: { maxHeight: 200, marginBottom: 16 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  suggestionIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  suggestionTextWrapper: { flex: 1, justifyContent: 'center' },
  suggestionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  suggestionSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 1 },

  // Inline dropdown suggestions (inside the search card)
  inlineSuggestionsWrapper: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 4,
  },
  inlineSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },

  quickActionsContainer: { flexDirection: 'column', gap: 12, marginBottom: 0 },
  quickActionCardDark: { 
    width: '100%', height: 56, backgroundColor: '#1C1C1E', borderRadius: 16, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },
  quickIconWrapperAbsolute: { 
    position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', 
    justifyContent: 'center', alignItems: 'center'
  },
  quickActionTextDark: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },

  sectionTitle: { fontSize: 24, fontWeight: '900', color: COLORS.onSurface, marginBottom: 16, letterSpacing: -0.5 },
  
  // Booking Mode Toggle
  bookingModeRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  bookingModeBtn: { 
    flex: 1, paddingVertical: 12, borderRadius: RADIUS.full, 
    borderWidth: 2, borderColor: '#1C1C1E', 
    alignItems: 'center', backgroundColor: '#FFFFFF' 
  },
  bookingModeBtnActive: { 
    borderColor: '#1C1C1E', backgroundColor: '#1C1C1E' 
  },
  bookingModeBtnText: { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  bookingModeBtnTextActive: { color: '#FFFFFF' },
  
  // Editable Pickup Row
  pickupRow: { flexDirection: 'row', alignItems: 'center' },
  editPickupBadge: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  editPickupText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  
  // Premium UX - Screen 3 Dual-Color Card Style
  premiumCarCard: { 
    width: width * 0.82, 
    borderRadius: 24, 
    backgroundColor: '#FFFFFF', 
    overflow: 'hidden', 
    marginRight: 16,
    ...SHADOWS.md,
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    opacity: 0.7,
  },
  cardDarkTop: {
    backgroundColor: '#1C1C1E', // Very dark top half
    padding: 24,
    paddingBottom: 40, // Space for the floating car
  },
  carModelText: { 
    fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 
  },
  carStatsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8
  },
  carStatText: {
    fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginLeft: 4
  },
  floatingCarWrapper: {
    position: 'absolute',
    top: 50, right: 20, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 4
  },
  cardWhiteBottom: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 16,
  },
  featuresTitle: {
    fontSize: 16, fontWeight: '800', color: COLORS.onSurface, marginBottom: 12
  },
  featuresRow: {
    flexDirection: 'row', gap: 8, marginBottom: 24
  },
  featurePill: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB'
  },
  featurePillText: {
    fontSize: 12, fontWeight: '700', color: COLORS.onSurfaceVariant
  },
  bookingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  priceText: {
    fontSize: 28, fontWeight: '900', color: COLORS.onSurface, letterSpacing: -1
  },
  priceCurrency: {
    fontSize: 14, color: COLORS.onSurfaceVariant, fontWeight: '600'
  },
  bookBtnBlack: {
    backgroundColor: '#000000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.full, ...SHADOWS.sm
  },
  bookBtnText: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '800'
  },

  confirmPinFloating: { position: 'absolute', left: 24, right: 24, zIndex: 25 },
  confirmMapBtn: { backgroundColor: '#1C1C1E', padding: 18, borderRadius: 20, alignItems: 'center', ...SHADOWS.xl, borderWidth: 1, borderColor: '#374151' },
  confirmMapBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  
  // Extracted styles from map core
  centerPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -48, zIndex: 10 },
  driverMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  uberPinContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -52, zIndex: 20 },

  // Dark Luxury Landing
  luxuryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 16 },
  luxuryBrandText: { fontSize: 20, fontWeight: '900', letterSpacing: 8, color: '#FFF' },
  luxuryAvatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  luxuryCarContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginLeft: 15 },
  luxuryCarHero: { width: width * 1.5, height: height * 0.55, opacity: 0.95 },
  luxuryTextWrapper: { paddingHorizontal: 32, paddingBottom: 60, zIndex: 20 },
  luxuryHeadline: { fontSize: 40, fontWeight: '900', color: '#FFF', letterSpacing: -1, lineHeight: 46 },
  luxurySub: { fontSize: 13, color: '#9CA3AF', marginTop: 16, lineHeight: 20, fontWeight: '600' },
  luxuryBtn: { width: '100%', backgroundColor: '#FFFFFF', paddingVertical: 18, borderRadius: 32, marginTop: 40, alignItems: 'center', ...SHADOWS.md },
  luxuryBtnText: { color: '#000000', fontSize: 18, fontWeight: '900' },

  // Select Vehicle Full Screen Mockup Layout
  sheetContentMockup: { flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden' },
  mockupTabs: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 12 },
  mockupTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
  mockupTabActive: { borderBottomWidth: 2, borderBottomColor: '#000' },
  mockupTabText: { fontSize: 16, color: '#9CA3AF', fontWeight: '800' },
  mockupTabTextActive: { color: '#000' },

  mockupMainCard: { backgroundColor: '#F8F9FA', borderRadius: 16, padding: 12, marginTop: 8, alignItems: 'stretch', borderWidth: 1, borderColor: '#E5E7EB' },
  mockupMainTitle: { alignSelf: 'flex-start', fontSize: 12, color: '#9CA3AF', fontWeight: '800', letterSpacing: 1 },
  mockupMainImg: { width: 220, height: 110, resizeMode: 'contain', marginVertical: 12 },
  mockupMainInfoRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'flex-end' },
  mockupMainName: { fontSize: 20, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  mockupMainSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  mockupMainSubText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  mockupMainPrice: { fontSize: 24, fontWeight: '900', color: '#111' },
  mockupMainPriceSub: { fontSize: 14, fontWeight: '700', color: '#6B7280' },

  mockupGridRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  mockupGridBox: { flex: 1, backgroundColor: '#F8F9FA', borderRadius: 28, padding: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', minHeight: 140 },
  mockupAvatarBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  mockupAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  mockupGridTitle: { fontSize: 15, fontWeight: '800', color: '#111' },
  mockupGridValue: { fontSize: 17, fontWeight: '900', color: '#111', marginTop: 4 },

  mockupBottomDark: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 12, paddingVertical: 12, marginTop: 10 },
  mockupBottomTitle: { fontSize: 13, color: '#9CA3AF', fontWeight: '700', marginBottom: 10 },
  mockupBottomSubText: { fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  mockupCarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mockupCarRowTitle: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  mockupArrowBtn: { justifyContent: 'center', alignItems: 'center' },
  mockupDivider: { height: 1, backgroundColor: '#333', marginVertical: 16 },
  mockupBookBtn: { 
    backgroundColor: '#1C1C1E', paddingVertical: 18, paddingHorizontal: 24, 
    borderRadius: 18, alignItems: 'center', marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  mockupBookBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },

  // Vehicle Type Selector (Standard / Premium)
  vehicleTypeRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  vehicleTypeBtn: { 
    flex: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 16, 
    backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center',
  },
  vehicleTypeBtnActive: { 
    backgroundColor: '#F0FFF4', borderColor: '#10B981',
  },
  vehicleTypeBtnActivePremium: { 
    backgroundColor: '#1C1C1E', borderColor: '#555',
  },
  vehicleTypeBtnIcon: { fontSize: 22, marginBottom: 4 },
  vehicleTypeBtnLabel: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  vehicleTypeBtnPrice: { fontSize: 13, fontWeight: '800', color: '#9CA3AF', marginTop: 4 },
  
  // Enhanced Trip Details Top Box
  enhancedRouteContainer: { position: 'absolute', left: 16, right: 16, zIndex: 10 },
  enhancedRouteCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  enhancedRouteLeft: { marginRight: 12 },
  enhancedBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  enhancedRouteContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  enhancedTimeline: { width: 16, alignItems: 'center', marginTop: 4, marginRight: 12 },
  enhancedTimelineCircle: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  enhancedTimelineLine: { width: 2, height: 18, backgroundColor: '#E5E7EB', marginVertical: 4 },
  enhancedTimelineSquare: { width: 8, height: 8, backgroundColor: '#111111', borderRadius: 2 },
  enhancedLocations: { flex: 1 },
  enhancedPickupText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  enhancedDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 6 },
  enhancedDropoffText: { fontSize: 16, color: '#000000', fontWeight: '800' },
  
  // Mockup Main Card Enhancements
  mockupMainCardPremium: { backgroundColor: '#1C1C1E', borderColor: '#333' },
  mockupHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: -10 },
  etaBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  etaBadgeText: { fontSize: 12, fontWeight: '800', color: '#111' },
  
  // Compact Car Layout inside Main Card
  carInfoCompactRow: { flexDirection: 'row', width: '100%', alignItems: 'center' },
  carVisualColumn: { alignItems: 'center', justifyContent: 'center' },
  smallCarImg: { width: 110, height: 60, resizeMode: 'contain' },
  licensePlate: { backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#333', marginTop: -4 },
  licensePlateText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  carTextColumn: { flex: 1, justifyContent: 'center' },
  mockupMainNameCompact: { fontSize: 16, fontWeight: '900', color: '#111', letterSpacing: -0.5 },
  mockupMainPriceCompact: { fontSize: 18, fontWeight: '900', color: '#111' },

  // Peek Strip — fixed at bottom, visible in collapsed state
  peekBookingBar: { flexDirection: 'column', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  peekCarInfo: { flex: 1, flexDirection: 'column', gap: 2 },
  peekCarName: { fontSize: 16, fontWeight: '900', color: '#111', flex: 1 },
  peekCarPrice: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  peekBookBtn: { backgroundColor: '#1C1C1E', paddingVertical: 14, borderRadius: 14, alignItems: 'center', width: '100%' },
  peekBookBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  // Peek top row: car name + price side by side
  peekTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 },

  // "Change Destination" back pill below the route card
  clearDestBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#1C1C1E', paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, marginTop: 8, gap: 6 },
  clearDestBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
