import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Image } from 'react-native';
import { ArrowLeft, ChevronRight, Clock, MapPin, Car, User, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { COLORS, SHADOWS } from '../../constants/theme';

const MOCK_TRIPS = [
  {
    id: '1',
    date: '10 Apr 9:36PM',
    dateAr: '10 أبريل 9:36 م',
    price: 239.93,
    driverName: 'youssef',
    driverNameAr: 'يوسف',
    riderName: 'Ali',
    riderNameAr: 'علي',
    pickup: "28 Ja'far ibn Abi Talib...",
    pickupAr: '٢٨ شارع جعفر بن أبي طالب...',
    dropoff: '36 Khaled Amin...',
    dropoffAr: '٣٦ شارع خالد أمين...',
    status: 'completed',
    type: 'Wedo Saver',
    typeAr: 'رحلة توفير',
  },
  {
    id: '2',
    date: '8 Apr 2:15PM',
    dateAr: '8 أبريل 2:15 م',
    price: 154.50,
    driverName: 'Ahmed',
    driverNameAr: 'أحمد',
    riderName: 'Omar',
    riderNameAr: 'عمر',
    pickup: 'Cairo Festival City Mall',
    pickupAr: 'كايرو فيستيفال سيتي مول',
    dropoff: 'Maadi, Road 9',
    dropoffAr: 'المعادي، شارع 9',
    status: 'completed',
    type: 'Wedo Comfort',
    typeAr: 'رحلة مريحة',
  },
  {
    id: '3',
    date: '5 Apr 10:00AM',
    dateAr: '5 أبريل 10:00 ص',
    price: 320.00,
    driverName: 'Mahmoud',
    driverNameAr: 'محمود',
    riderName: 'Hassan',
    riderNameAr: 'حسن',
    pickup: 'Giza Necropolis',
    pickupAr: 'أهرامات الجيزة',
    dropoff: 'Zamalek',
    dropoffAr: 'الزمالك',
    status: 'completed',
    type: 'Wedo Saver',
    typeAr: 'رحلة توفير',
  }
];

export default function TripHistoryScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const { user } = useAuthStore();
  const isDriver = user?.role === 'driver';

  const renderTripItem = ({ item }: { item: any }) => {
    const personName = isDriver ? (isRTL ? item.riderNameAr : item.riderName) : (isRTL ? item.driverNameAr : item.driverName);
    const personRoleLabel = isDriver ? (isRTL ? 'الراكب' : 'Passenger') : (isRTL ? 'الكابتن' : 'Captain');

    return (
      <TouchableOpacity 
        style={styles.tripCard} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('TripDetails', { tripData: item })}
      >
        <View style={[styles.tripHeader, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.typeBadge, isRTL && { flexDirection: 'row-reverse' }]}>
             <View style={styles.iconWrap}>
               {isDriver ? (
                  <User color={COLORS.primary} size={14} />
               ) : (
                  <Car color={COLORS.primary} size={14} />
               )}
             </View>
             <Text style={styles.typeText}>{isDriver ? `${personName} (${personRoleLabel})` : (isRTL ? item.typeAr : item.type)}</Text>
          </View>
          <Text style={[styles.priceText, isDriver && { color: COLORS.success }]}>
            {isDriver ? '+' : ''}{isRTL ? `ج.س ${item.price.toFixed(2)}` : `SDG ${item.price.toFixed(2)}`}
          </Text>
        </View>

        <View style={[styles.tripBody, isRTL && { flexDirection: 'row-reverse' }]}>
          {/* Route Indicators */}
          <View style={styles.routeCol}>
            <View style={styles.routeDot} />
            <View style={styles.routeLine} />
            <View style={styles.routeSquare} />
          </View>

          {/* Addresses */}
          <View style={[styles.addressesCol, isRTL && { alignItems: 'flex-end', marginLeft: 0, marginRight: 12 }]}>
            <Text style={[styles.addressText, isRTL && { textAlign: 'right' }]}>{isRTL ? item.pickupAr : item.pickup}</Text>
            <View style={{ height: 24 }} />
            <Text style={[styles.addressText, isRTL && { textAlign: 'right' }]}>{isRTL ? item.dropoffAr : item.dropoff}</Text>
          </View>
          
          {/* Date and Arrow */}
          <View style={styles.rightCol}>
            <View style={[styles.dateRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <Clock color={COLORS.onSurfaceVariant} size={12} style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }} />
              <Text style={styles.dateText}>{isRTL ? item.dateAr : item.date}</Text>
            </View>
            {isRTL ? (
              <ChevronLeft color="#CBD5E1" size={20} style={{ marginTop: 12, alignSelf: 'flex-start' }} />
            ) : (
              <ChevronRight color="#CBD5E1" size={20} style={{ marginTop: 12, alignSelf: 'flex-end' }} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#1C1C1E" size={22} style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && { textAlign: 'right' }]}>
          {isRTL ? 'الرحلات السابقة' : 'Your trips'}
        </Text>
      </View>

      <FlatList
        data={MOCK_TRIPS}
        keyExtractor={item => item.id}
        renderItem={renderTripItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1C1E',
    marginLeft: 14,
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  tripBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCol: {
    alignItems: 'center',
    width: 16,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  routeSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  addressesCol: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
  },
});
