import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, Keyboard, Alert } from 'react-native';
import * as Location from 'expo-location';
import useAuthStore from '../../store/useAuthStore';
import useTripStore from '../../store/useTripStore';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { ZONES as LOCAL_ZONES, ZoneItem, getZoneFare } from '../../constants/zones';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { Search, MapPin, Car, User, X, ChevronRight, Crown, Shield, Clock, Menu, Wallet, History } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Safe map import
let MapView: any = null;
let Marker: any = null;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
} catch (e) {}

export default function UserHomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuthStore();
  const { vehicleType, setVehicleType, setPickupZone, setDropoffZone, setFareEstimate, setTripStatus } = useTripStore();

  const [location, setLocation] = useState<any>(null);
  const [destination, setDestination] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [zones, setZones] = useState<ZoneItem[]>(LOCAL_ZONES);
  const [filteredZones, setFilteredZones] = useState<ZoneItem[]>([]);
  const [selectedDropoff, setSelectedDropoff] = useState<ZoneItem | null>(null);
  const [mapError, setMapError] = useState(false);

  // Fetch zones from API, fallback to local
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
        // Use local zones as fallback
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
      } catch (e) {}
    })();
  }, []);

  // Smart search filter
  useEffect(() => {
    if (destination.trim().length > 0) {
      const query = destination.toLowerCase();
      const results = zones.filter(z => {
        return z.name.toLowerCase().includes(query) || 
               z.nameAr.includes(destination) || 
               z.description?.toLowerCase().includes(query) ||
               z.descriptionAr?.includes(destination);
      });
      setFilteredZones(results);
      setShowSuggestions(true);
    } else {
      setFilteredZones([]);
      setShowSuggestions(false);
    }
  }, [destination, zones]);

  const handleSelectDestination = async (zone: ZoneItem) => {
    setSelectedDropoff(zone);
    setDropoffZone(zone);
    setDestination(isRTL ? zone.nameAr : zone.name);
    setShowSuggestions(false);
    Keyboard.dismiss();

    // Try to get pricing from API
    try {
      const pickupId = zones[0]._id;
      const response = await api.get(`/zones/pricing?from=${pickupId}&to=${zone._id}`);
      const pricing = response.data;
      const fare = vehicleType === 'premium' ? pricing.premiumFare : pricing.baseFare;
      setFareEstimate(fare);
    } catch (e) {
      // Fallback to local pricing
      const fare = getZoneFare(zones[0]._id, zone._id, vehicleType);
      setFareEstimate(fare);
    }
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
  };

  const handleSelectType = async (type: 'standard' | 'premium') => {
    setVehicleType(type);
    if (selectedDropoff) {
      try {
        const pickupId = zones[0]._id;
        const response = await api.get(`/zones/pricing?from=${pickupId}&to=${selectedDropoff._id}`);
        const pricing = response.data;
        const fare = type === 'premium' ? pricing.premiumFare : pricing.baseFare;
        setFareEstimate(fare);
      } catch (e) {
        const fare = getZoneFare(zones[0]._id, selectedDropoff._id, type);
        setFareEstimate(fare);
      }
    }
  };

  const currentFare = selectedDropoff ? getZoneFare(zones[0]._id, selectedDropoff._id, vehicleType) : 0;
  const standardFare = selectedDropoff ? getZoneFare(zones[0]._id, selectedDropoff._id, 'standard') : 0;
  const premiumFare = selectedDropoff ? getZoneFare(zones[0]._id, selectedDropoff._id, 'premium') : 0;

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
                <View style={styles.userMarker} />
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
          <View style={styles.mapCenterDotInner} />
          <View style={styles.mapCenterDotRing} />
        </View>
        <View style={[styles.driverDot, { top: '30%', left: '25%' }]}><Car color={COLORS.onSurface} size={14} /></View>
        <View style={[styles.driverDot, { top: '35%', right: '20%' }]}><Car color={COLORS.onSurface} size={14} /></View>
        <View style={[styles.driverDot, { bottom: '45%', left: '55%' }]}><Car color={COLORS.onSurface} size={14} /></View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}

      {/* Top bar — profile + menu */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
          <Menu color={COLORS.onSurface} size={22} />
        </TouchableOpacity>
        <Text style={[styles.brandText, { color: '#000000' }]}>Wedo</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
          <User color={COLORS.onSurface} size={22} />
        </TouchableOpacity>
      </View>

      {/* Search + Suggestions overlay */}
      {showSuggestions && (
        <View style={styles.suggestionsOverlay}>
          <View style={styles.suggestionsCard}>
            <View style={styles.sugSearchBar}>
              <Search size={18} color={COLORS.onSurfaceVariant} style={{ marginRight: 8 }} />
              <TextInput
                placeholder={t('where_to')}
                placeholderTextColor={COLORS.onSurfaceVariant}
                style={[styles.sugSearchInput, isRTL && { textAlign: 'right' }]}
                value={destination}
                onChangeText={setDestination}
                autoFocus
              />
              <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
                <X size={16} color={COLORS.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {filteredZones.length > 0 ? filteredZones.map((zone) => (
              <TouchableOpacity key={zone._id} style={styles.suggestionItem} onPress={() => handleSelectDestination(zone)}>
                <View style={styles.suggestionIcon}><MapPin color={COLORS.primary} size={16} /></View>
                <View style={styles.suggestionContent}>
                  <Text style={[styles.suggestionName, isRTL && { textAlign: 'right' }]}>{isRTL ? zone.nameAr : zone.name}</Text>
                  <Text style={[styles.suggestionDesc, isRTL && { textAlign: 'right' }]}>{isRTL ? (zone.descriptionAr || zone.description) : zone.description}</Text>
                </View>
                <ChevronRight color={COLORS.outlineVariant} size={16} />
              </TouchableOpacity>
            )) : (
              <View style={styles.noResults}><Search size={20} color={COLORS.outlineVariant} /><Text style={styles.noResultsText}>{isRTL ? 'لا توجد نتائج' : 'No zones found'}</Text></View>
            )}
          </View>
        </View>
      )}

      {/* Bottom sheet — "Where to?" */}
      <View style={styles.bottomSheet}>
        {/* Where to search bar */}
        {!selectedDropoff ? (
          <TouchableOpacity
            style={styles.whereToBar}
            onPress={() => {
              setShowSuggestions(true);
            }}
            activeOpacity={0.9}
          >
            <View style={styles.whereToIcon}><Search size={20} color={COLORS.onPrimary} /></View>
            <Text style={[styles.whereToText, isRTL && { textAlign: 'right' }]}>{t('where_to')}</Text>
          </TouchableOpacity>
        ) : (
          /* Destination selected — show trip type + request */
          <View>
            {/* Destination row */}
            <View style={styles.destRow}>
              <View style={styles.destDot} />
              <Text style={[styles.destText, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
                {isRTL ? selectedDropoff.nameAr : selectedDropoff.name}
              </Text>
              <TouchableOpacity onPress={clearSearch} style={styles.destChange}>
                <Text style={styles.destChangeText}>{t('change')}</Text>
              </TouchableOpacity>
            </View>

            {/* Trip type toggle */}
            <View style={styles.typeRow}>
              <TouchableOpacity 
                style={[styles.typeChip, vehicleType === 'standard' && styles.typeChipActive]} 
                onPress={() => handleSelectType('standard')}
              >
                <Shield color={vehicleType === 'standard' ? COLORS.onPrimary : COLORS.primary} size={16} />
                <Text style={[styles.typeChipText, vehicleType === 'standard' && styles.typeChipTextActive]}>
                  {t('mashi_standard')}
                </Text>
                <Text style={[styles.typeChipPrice, vehicleType === 'standard' && styles.typeChipPriceActive]}>
                  {t('sdg')} {standardFare.toLocaleString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeChip, vehicleType === 'premium' && styles.typeChipActivePremium]} 
                onPress={() => handleSelectType('premium')}
              >
                <Crown color={vehicleType === 'premium' ? '#fff' : '#b8860b'} size={16} />
                <Text style={[styles.typeChipText, vehicleType === 'premium' && styles.typeChipTextActivePremium]}>
                  {t('mashi_premium')}
                </Text>
                <Text style={[styles.typeChipPrice, vehicleType === 'premium' && styles.typeChipPriceActivePremium]}>
                  {t('sdg')} {premiumFare.toLocaleString()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Request button */}
            <TouchableOpacity
              style={[styles.requestBtn, vehicleType === 'premium' && styles.requestBtnPremium]}
              onPress={handleRequestRide}
            >
              <Text style={styles.requestBtnText}>
                {t('request_ride')} • {t('sdg')} {currentFare.toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick action row */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.quickIcon}><History color={COLORS.onSurfaceVariant} size={20} /></View>
            <Text style={styles.quickLabel}>{t('tab_trips')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.quickIcon}><Wallet color={COLORS.onSurfaceVariant} size={20} /></View>
            <Text style={styles.quickLabel}>{t('tab_wallet')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.quickIcon}><User color={COLORS.onSurfaceVariant} size={20} /></View>
            <Text style={styles.quickLabel}>{t('tab_profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  
  // Fallback map
  mapFallback: { flex: 1, backgroundColor: '#e8d5b8', position: 'relative' },
  mapGrid: { flex: 1, opacity: 0.08 },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.primary },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: COLORS.primary },
  mapCenterDot: { position: 'absolute', top: '40%', left: '50%', marginLeft: -20, marginTop: -20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mapCenterDotInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#fff', zIndex: 2 },
  mapCenterDotRing: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, opacity: 0.15 },
  driverDot: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surfaceContainerLowest, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },

  // Top bar
  topBar: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.surfaceContainerLowest,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.md,
  },
  brandText: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },
  // Suggestions overlay
  suggestionsOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.surface, zIndex: 100, paddingTop: 50,
  },
  suggestionsCard: { flex: 1, paddingHorizontal: 16 },
  sugSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow, padding: 14, borderRadius: RADIUS.xl,
    marginBottom: 8,
  },
  sugSearchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.onSurface },
  clearBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceContainerLow,
  },
  suggestionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryFixed, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  suggestionContent: { flex: 1 },
  suggestionName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },
  suggestionDesc: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginTop: 2 },
  noResults: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  noResultsText: { fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant, marginLeft: 8 },

  userMarker: { width: 14, height: 14, backgroundColor: COLORS.primary, borderRadius: 7, borderWidth: 3, borderColor: '#fff' },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'],
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28,
    ...SHADOWS.lg, zIndex: 5,
  },

  // Where to bar
  whereToBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl, padding: 16, marginBottom: 16,
  },
  whereToIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  whereToText: { flex: 1, fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.onSurfaceVariant },

  // Destination selected
  destRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.lg,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
  },
  destDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginRight: 12 },
  destText: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },
  destChange: { paddingHorizontal: 8, paddingVertical: 4 },
  destChangeText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.primary },

  // Type row
  typeRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  typeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 10,
    borderWidth: 1.5, borderColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.surfaceContainerLowest,
  },
  typeChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeChipActivePremium: { borderColor: '#b8860b', backgroundColor: '#b8860b' },
  typeChipText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.onSurface, marginLeft: 6 },
  typeChipTextActive: { color: COLORS.onPrimary },
  typeChipTextActivePremium: { color: '#fff' },
  typeChipPrice: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.onSurfaceVariant, marginLeft: 4 },
  typeChipPriceActive: { color: 'rgba(255,255,255,0.8)' },
  typeChipPriceActivePremium: { color: 'rgba(255,255,255,0.8)' },

  // Request
  requestBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.xl,
    alignItems: 'center', marginBottom: 16, ...SHADOWS.md,
  },
  requestBtnPremium: { backgroundColor: '#b8860b' },
  requestBtnText: { color: '#fff', fontSize: FONT_SIZES.lg, fontWeight: 'bold' },

  // Quick actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-around' },
  quickItem: { alignItems: 'center' },
  quickIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  quickLabel: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, fontWeight: '600' },
});
