import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Image } from 'react-native';
import { ArrowLeft, ChevronRight, Clock, MapPin, Car, User } from 'lucide-react-native';
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
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TripDetails', { tripData: item })}
      >
        <View style={[styles.tripHeader, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={[styles.typeBadge, isRTL && { flexDirection: 'row-reverse' }]}>
             {isDriver ? (
                <User color="#111" size={14} style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }} />
             ) : (
                <Car color="#111" size={14} style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }} />
             )}
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
          <View style={{ height: 16 }} />
          <Text style={[styles.addressText, isRTL && { textAlign: 'right' }]}>{isRTL ? item.dropoffAr : item.dropoff}</Text>
        </View>
        
        {/* Date and Arrow */}
        <View style={styles.rightCol}>
           <View style={[styles.dateRow, isRTL && { flexDirection: 'row-reverse' }]}>
             <Clock color="#6B7280" size={12} style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }} />
             <Text style={styles.dateText}>{isRTL ? item.dateAr : item.date}</Text>
           </View>
           <ChevronRight color="#C0C0C0" size={20} style={isRTL ? { transform: [{ rotate: '180deg' }], marginTop: 12, alignSelf: 'flex-start' } : { marginTop: 12, alignSelf: 'flex-end' }} />
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
          <ArrowLeft color="#111" size={28} style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}} />
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
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FAF9F6',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
    marginLeft: 16,
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
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#111',
    borderWidth: 1.5,
    borderColor: '#111',
  },
  routeSquare: {
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#111',
  },
  routeLine: {
    width: 1.5,
    height: 20,
    backgroundColor: '#111',
    marginVertical: 2,
  },
  addressesCol: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});
