import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image, Dimensions, Alert, Linking } from 'react-native';
import { ArrowLeft, Receipt, ChevronRight, Star, HeartHandshake, MapPin, Navigation, Shield, Key, HelpCircle, ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import useTripStore from '../../store/useTripStore';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function TripDetailsScreen({ route, navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const { user } = useAuthStore();
  const isDriver = user?.role === 'driver';
  
  const tripData = route.params?.tripData;
  const { pickupZone, dropoffZone, fareEstimate, assignedDriver, currentTrip } = useTripStore();
  
  const originalDriverName = assignedDriver?.name || 'youssef';
  const driverName = tripData ? (isRTL ? tripData.driverNameAr : tripData.driverName) : originalDriverName;
  const riderName = tripData ? (isRTL ? tripData.riderNameAr : tripData.riderName) : 'Ali';
  const personName = isDriver ? riderName : driverName;
  
  const driverPhone = assignedDriver?.phone || '+249900000000';
  const price = tripData ? tripData.price : (fareEstimate > 0 ? fareEstimate : 239.93);
  const tripDate = tripData ? (isRTL ? tripData.dateAr : tripData.date) : (isRTL ? '10 أبريل 9:36 م' : '10 Apr 9:36PM');
  const typeTitle = tripData ? (isRTL ? tripData.typeAr : tripData.type) : (isRTL ? 'رحلة توفير' : 'Wedo Saver');
  
  const displayPickup = tripData ? (isRTL ? tripData.pickupAr : tripData.pickup) : (pickupZone ? (isRTL ? pickupZone.nameAr : pickupZone.name) : (isRTL ? '٢٨ شارع جعفر بن أبي طالب، القاهرة الجديدة ١، محافظة القاهرة ٤٧...' : "28 Ja'far ibn Abi Talib, New Cairo 1, Cairo Governorate 47..."));
  const displayDropoff = tripData ? (isRTL ? tripData.dropoffAr : tripData.dropoff) : (dropoffZone ? (isRTL ? dropoffZone.nameAr : dropoffZone.name) : (isRTL ? '٣٦ شارع خالد أمين، أولى الهرم، الطالبية، محافظة الجيزة...' : "36 Khaled Amin, Oula Al Haram, El Talbia, Giza Gover..."));

  const handleReceipt = () => {
    Alert.alert(isRTL ? 'الإيصال' : 'Receipt', isRTL ? `إجمالي الأجرة: ج.س ${price}` : `Total Fare: SDG ${price}`);
  };

  const handleTip = () => {
    Alert.alert(
      isRTL ? 'إضافة إكرامية' : 'Add Tip',
      isRTL ? 'هل ترغب في إضافة إكرامية للسائق؟' : 'Would you like to add a tip for the driver?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: isRTL ? 'إضافة ج.س 50' : 'Add SDG 50', onPress: () => Alert.alert(isRTL ? 'نجاح' : 'Success', isRTL ? 'تمت إضافة الإكرامية!' : 'Tip added successfully!') }
      ]
    );
  };

  const handleRate = () => {
    Alert.alert(isRTL ? 'التقييم' : 'Rate', isRTL ? (isDriver ? 'تقييم الراكب' : 'تقييم الكابتن') : (isDriver ? 'Rate Passenger' : 'Rate Driver'));
  };

  const handleLostItem = () => {
    Alert.alert(
      isRTL ? (isDriver ? 'عنصر مفقود' : 'غرض مفقود') : 'Lost Item',
      isRTL ? `هل تريد الاتصال بـ ${personName}؟` : `Do you want to call ${personName}?`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: isRTL ? 'اتصال' : 'Call', onPress: () => Linking.openURL(`tel:${driverPhone}`) }
      ]
    );
  };

  const handleSafety = () => {
    Alert.alert(isRTL ? 'الإبلاغ عن مشكلة أمان' : 'Report Safety Issue', isRTL ? 'سيتواصل معك فريق الدعم قريباً.' : 'Our support team will contact you shortly.');
  };

  const handleSupport = () => {
    Alert.alert(isRTL ? 'خدمة العملاء' : 'Customer Support', isRTL ? 'جاري تحويلك للمساعدة.' : 'Redirecting to help center.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color="#111" size={28} style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && { textAlign: 'right' }]}>
          {isRTL ? 'تفاصيل الرحلة' : 'Trip details'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Map Snapshot */}
        <View style={styles.mapContainer}>
          <Image 
            source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=29.988,31.142&zoom=11&size=600x300&maptype=roadmap&path=color:0x000000ff|weight:4|29.988,31.142|30.012,31.205|30.044,31.235|30.028,31.408&markers=color:black|size:small|29.988,31.142&markers=color:black|size:small|30.028,31.408&key=YOUR_API_KEY' }} 
            style={styles.mapImage} 
            resizeMode="cover"
          />
        </View>

        {/* Title and Avatar */}
        <View style={[styles.titleRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tripTitle, isRTL && { textAlign: 'right' }]}>
              {`${typeTitle} ${isRTL ? 'مع' : 'with'} ${personName}`}
            </Text>
          </View>
          <View style={styles.avatarContainer}>
             {/* Using an anonymous avatar similar to screenshot or real avatar */}
             <Image source={{ uri: !isDriver ? (assignedDriver?.profilePicture || `https://ui-avatars.com/api/?name=${personName}&background=e5e7eb&color=9ca3af&size=128`) : `https://ui-avatars.com/api/?name=${personName}&background=0084FF&color=fff&size=128` }} style={styles.avatar} />
          </View>
        </View>

        {/* Date and Price */}
        <View style={[styles.datePriceContainer, isRTL && { alignItems: 'flex-end' }]}>
           <Text style={styles.dateTimeText}>{tripDate}</Text>
           <Text style={styles.priceText}>{isRTL ? `ج.س ${price.toFixed(2)}` : `SDG ${price.toFixed(2)}`}</Text>
        </View>

        {/* Receipt Button */}
        <View style={[styles.receiptRow, isRTL && { justifyContent: 'flex-end' }]}>
          <TouchableOpacity style={[styles.receiptBtn, isRTL && { flexDirection: 'row-reverse' }]} onPress={handleReceipt} activeOpacity={0.7}>
            <Receipt color="#111" size={20} style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }} />
            <Text style={styles.receiptBtnText}>{isRTL ? 'الإيصال' : 'Receipt'}</Text>
          </TouchableOpacity>
        </View>

        {/* Route Details */}
        <View style={styles.routeContainer}>
          {/* Pickup */}
          <View style={[styles.routeItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.routeIconContainer}>
              <View style={styles.routeDot} />
            </View>
            <View style={[styles.routeTextContainer, isRTL && { alignItems: 'flex-end' }]}>
              <Text style={[styles.routeAddress, isRTL && { textAlign: 'right' }]}>
                {displayPickup}
              </Text>
            </View>
            <Text style={styles.routeTime}>{isRTL ? '9:43 م' : '9:43 PM'}</Text>
          </View>

          {/* Line separator */}
          <View style={[isRTL ? styles.routeLineRTL : styles.routeLine, { height: 24 }]} />

          {/* Dropoff */}
          <View style={[styles.routeItem, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.routeIconContainer}>
              <View style={styles.routeSquare} />
            </View>
            <View style={[styles.routeTextContainer, isRTL && { alignItems: 'flex-end' }]}>
              <Text style={[styles.routeAddress, isRTL && { textAlign: 'right' }]}>
                {displayDropoff}
              </Text>
            </View>
            <Text style={styles.routeTime}>{isRTL ? '10:25 م' : '10:25 PM'}</Text>
          </View>
        </View>

        {/* Tip Row: Hide if Driver */}
        {!isDriver && (
          <View style={[styles.actionRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.actionLeft, isRTL && { flexDirection: 'row-reverse' }]}>
               <HeartHandshake color="#111" size={24} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
               <Text style={styles.actionMainText}>{isRTL ? 'لم تتم إضافة إكرامية' : 'No tip added'}</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={handleTip}>
               <Text style={styles.actionBtnText}>{isRTL ? 'أضف' : 'Add tip'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rating Row */}
        <View style={[styles.actionRow, isRTL && { flexDirection: 'row-reverse' }, { borderBottomWidth: 0, paddingBottom: 16 }]}>
          <View style={[styles.actionLeft, isRTL && { flexDirection: 'row-reverse' }]}>
             <Star color="#111" size={24} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
             <Text style={styles.actionMainText}>{isRTL ? 'لا يوجد تقييم' : 'No rating'}</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleRate}>
             <Text style={styles.actionBtnText}>{isRTL ? 'قيّم' : 'Rate'}</Text>
          </TouchableOpacity>
        </View>

        {/* Help & Safety Section */}
        <View style={styles.helpSection}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
            {isRTL ? 'المساعدة والأمان' : 'Help & safety'}
          </Text>

          <TouchableOpacity style={[styles.helpItem, isRTL && { flexDirection: 'row-reverse' }]} onPress={handleLostItem} activeOpacity={0.7}>
            <View style={styles.helpIconContainer}>
               <Key color="#111" size={20} />
            </View>
            <View style={[styles.helpTextContainer, isRTL && { alignItems: 'flex-end', paddingRight: 16 }]} >
               <Text style={[styles.helpItemTitle, isRTL && { textAlign: 'right' }]}>
                 {isDriver ? (isRTL ? 'العثور على غرض مفقود' : 'Found a lost item?') : (isRTL ? 'العثور على غرض مفقود' : 'Find lost item')}
               </Text>
               <Text style={[styles.helpItemSub, isRTL && { textAlign: 'right' }]}>
                 {isDriver ? (isRTL ? 'تواصل مع الراكب' : 'We can help you contact the passenger') : (isRTL ? 'يمكننا المساعدة في تواصلك مع السائق' : 'We can help you get in touch with your driver')}
               </Text>
            </View>
            <ChevronRight color="#C0C0C0" size={20} style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.helpItem, isRTL && { flexDirection: 'row-reverse' }]} onPress={handleSafety} activeOpacity={0.7}>
            <View style={styles.helpIconContainer}>
               <Shield color="#111" size={20} />
            </View>
            <View style={[styles.helpTextContainer, isRTL && { alignItems: 'flex-end', paddingRight: 16 }]} >
               <Text style={[styles.helpItemTitle, isRTL && { textAlign: 'right' }]}>{isRTL ? 'الإبلاغ عن مشكلة أمان' : 'Report safety issue'}</Text>
               <Text style={[styles.helpItemSub, isRTL && { textAlign: 'right' }]}>{isRTL ? 'أبلغنا بأي مشاكل متعلقة بالأمان' : 'Report any safety related issues to us'}</Text>
            </View>
            <ChevronRight color="#C0C0C0" size={20} style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}} />
          </TouchableOpacity>
        </View>

        {/* Customer Support Button */}
        <TouchableOpacity style={[styles.supportBtn, isRTL && { flexDirection: 'row-reverse' }]} onPress={handleSupport} activeOpacity={0.8}>
           <HelpCircle color="#111" size={20} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
           <Text style={styles.supportBtnText}>{isRTL ? 'خدمة العملاء' : 'Customer Support'}</Text>
           <View style={{ flex: 1 }} />
           <ArrowRight color="#111" size={20} style={isRTL ? { transform: [{ rotate: '180deg' }] } : {}} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// Styles below

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
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
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  datePriceContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 18,
    color: '#111',
    fontWeight: '500',
  },
  receiptRow: {
    paddingHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  receiptBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  routeContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
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
    backgroundColor: '#111',
    marginLeft: 11,
  },
  routeLineRTL: {
    width: 1.5,
    backgroundColor: '#111',
    marginRight: 11,
  },
  routeTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  routeAddress: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  routeTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionMainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  actionBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  helpSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  helpIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTextContainer: {
    flex: 1,
    paddingLeft: 16,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  helpItemSub: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 40,
  },
  supportBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
});
