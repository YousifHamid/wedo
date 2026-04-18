import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import WalletBalanceCard from '../../components/WalletBalanceCard';
import CustomAlert from '../../components/CustomAlert';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { Phone, Mail, Car, Settings, LogOut, ChevronLeft, ChevronRight, Star, Wallet, Clock, MessageSquare } from 'lucide-react-native';

export default function ProfileScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, logout, setUser, token, switchRole, originalRole } = useAuthStore();
  const isDriver = user?.role === 'driver';
  const [loading, setLoading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // Animation for feedback message
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sync profile data + Show feedback message
  useEffect(() => {
    // ── 1. Show Feedback UI ────────────────────────────────────────────────
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.delay(5000), // Show for 5 seconds
      Animated.timing(fadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    // ── 2. Sync Profile ───────────────────────────────────────────────────
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.user) {
          setUser(response.data.user, token as string);
        }
      } catch (e) {
        console.log('[Wedo] Profile sync failed');
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setLocalAvatar(result.assets[0].uri);
        // Ideally: await api.put('/users/avatar', formData) then update useAuthStore user.
      }
    } catch (e) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'تحتاج إلى تثبيت مكتبة الصور أولاً.' : 'Image Picker is required.');
    }
  };

  const getRelativeValue = (val: number | undefined) => {
    if (val === undefined || val === null) return '0';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Feedback Overlay Message */}
      <Animated.View style={[styles.feedbackOverlay, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <MessageSquare color="#fff" size={20} />
        <Text style={styles.feedbackText}>
          {isRTL 
            ? 'يرجى إرسال ملاحظاتكم وتقييمكم إلى يوسف للتطوير أو التأكيد'
            : 'Please send your feedback and rating to Yousif for development and confirmation'}
        </Text>
      </Animated.View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Back button only — name shown below avatar */}
        <View style={[styles.headerBar, isRTL && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft color={COLORS.onSurface} size={28} />
          </TouchableOpacity>
        </View>

      {/* Avatar + Name */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: localAvatar || user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&background=00603e&color=fff&size=128` }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editBtn} onPress={handlePickAvatar}>
            <Settings color="#000000" size={16} />
          </TouchableOpacity>
        </View>
        {/* Name + Role — below avatar, only here */}
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          {isDriver
            ? <Car size={14} color="#FFFFFF" />
            : <User size={14} color="#FFFFFF" />
          }
          <Text style={styles.roleText}>
            {isDriver
              ? (isRTL ? 'كابتن' : 'Captain')
              : (isRTL ? 'زبون' : 'Passenger')}
          </Text>
        </View>
      </View>

      {/* Wallet Balance */}
      <View style={styles.walletSection}>
        <WalletBalanceCard
          balance={user?.walletBalance || 0}
          onTopUp={isDriver ? () => navigation.navigate('DriverWallet') : undefined}
        />
      </View>

      {/* Stats - Real data from user object */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Star color="#FFFFFF" fill="#FFFFFF" size={20} />
          <Text style={styles.statValue}>{user?.reliabilityScore ? (user.reliabilityScore / 20).toFixed(2) : '5.00'}</Text>
          <Text style={styles.statLabel}>{t('rating')}</Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={styles.statValue}>{user?.totalTrips || 0}</Text>
          <Text style={styles.statLabel}>{isDriver ? t('trips_count') : t('rides_count')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#111111' }]}>
            {t('sdg')} {getRelativeValue(isDriver ? user?.totalEarnings : 0)}
          </Text>
          <Text style={styles.statLabel}>{isDriver ? t('total_earnings') : t('spent')}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
          {isRTL ? 'الوصول السريع' : 'Quick Access'}
        </Text>
        <View style={styles.actionGrid}>
          {isDriver && (
            <TouchableOpacity style={[styles.actionCard, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => navigation.navigate('DriverWallet')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFFFFF' }, isRTL && { marginRight: 0, marginLeft: 14 }]}>
                <Wallet color="#000000" size={24} />
              </View>
              <Text style={[styles.actionLabel, isRTL && { textAlign: 'right' }]}>{t('tab_wallet')}</Text>
              {isRTL ? <ChevronLeft color="#111111" size={18} /> : <ChevronRight color="#111111" size={18} />}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionCard, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => i18n.changeLanguage(isRTL ? 'en' : 'ar')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFFFFF' }, isRTL && { marginRight: 0, marginLeft: 14 }]}>
              <Text style={{color: '#000000', fontSize: 14, fontWeight: '900'}}>{isRTL ? 'EN' : 'AR'}</Text>
            </View>
            <Text style={[styles.actionLabel, isRTL && { textAlign: 'right' }]}>{isRTL ? 'تغيير اللغة (English)' : 'Change Language (عربي)'}</Text>
            {isRTL ? <ChevronLeft color="#111111" size={18} /> : <ChevronRight color="#111111" size={18} />}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, isRTL && { flexDirection: 'row-reverse' }]} onPress={() => navigation.navigate('TripHistory')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFFFFF' }, isRTL && { marginRight: 0, marginLeft: 14 }]}>
              <Clock color="#000000" size={24} />
            </View>
            <Text style={[styles.actionLabel, isRTL && { textAlign: 'right' }]}>{t('tab_trips')}</Text>
            {isRTL ? <ChevronLeft color="#111111" size={18} /> : <ChevronRight color="#111111" size={18} />}
          </TouchableOpacity>

          {(originalRole === 'driver' || user?.role === 'driver') && (
            <TouchableOpacity 
              style={[styles.actionCard, isRTL && { flexDirection: 'row-reverse' }, { backgroundColor: '#FFFFFF', marginTop: 10, borderColor: '#E5E7EB', borderWidth: 1 }]} 
              onPress={switchRole}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFFFFF' }, isRTL && { marginRight: 0, marginLeft: 14 }]}>
                {user?.role === 'driver' ? <Car color="#000000" size={24} /> : <Settings color="#000000" size={24} />}
              </View>
              <Text style={[styles.actionLabel, isRTL && { textAlign: 'right' }, { fontWeight: '800' }]}>
                {user?.role === 'driver' 
                  ? (isRTL ? 'التبديل لحساب الراكب' : 'Switch to Passenger Account')
                  : (isRTL ? 'التبديل لحساب الكابتن' : 'Switch to Captain Account')
                }
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('account_info')}</Text>
        <View style={styles.infoCard}>
          <View style={[styles.infoRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.iconBox, isRTL && { marginRight: 0, marginLeft: 14 }, { backgroundColor: '#F3F4F6' }]}><Mail color="#000000" size={20} /></View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoValue, isRTL && { textAlign: 'right' }]}>{user?.email || '---'}</Text>
              <Text style={[styles.infoLabel, isRTL && { textAlign: 'right' }]}>{t('email_address')}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderColor: '#E5E7EB' }, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.iconBox, isRTL && { marginRight: 0, marginLeft: 14 }, { backgroundColor: '#F3F4F6' }]}><Phone color="#000000" size={20} /></View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoValue, isRTL && { textAlign: 'right' }]}>{user?.phone}</Text>
              <Text style={[styles.infoLabel, isRTL && { textAlign: 'right' }]}>{t('phone_label')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Vehicle (driver only) */}
      {isDriver && user?.vehicleDetails && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('vehicle_details')}</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}><Car color="#000000" size={20} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>{user.vehicleDetails.make} {user.vehicleDetails.model} {user.vehicleDetails.year}</Text>
                <Text style={styles.infoLabel}>{user.vehicleDetails.color} • Plate: {user.vehicleDetails.plateNumber}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut color={COLORS.error} size={20} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>

    {/* Logout Confirmation — Premium */}
    <CustomAlert
      visible={showLogoutAlert}
      type="warning"
      emoji="👋"
      title={isRTL ? 'تسجيل الخروج' : 'Log Out'}
      message={
        isRTL
          ? 'هل أنت متأكد من تسجيل الخروج؟\nيرجى إرسال ملاحظاتك ليوسف لتحسين التطبيق'
          : 'Are you sure you want to log out?\nPlease send your feedback to Yousif to help us improve.'
      }
      buttons={[
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel', onPress: () => setShowLogoutAlert(false) },
        { text: isRTL ? 'تسجيل الخروج' : 'Log Out', style: 'destructive', onPress: () => { setShowLogoutAlert(false); logout(); } },
      ]}
      onDismiss={() => setShowLogoutAlert(false)}
    />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F6' },

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: 55, paddingBottom: SPACING.md,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111111', letterSpacing: -0.5 },

  header: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { width: 100, height: 100, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#111111' },
  editBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFFFFF', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#111111' },
  userName: { fontSize: 26, fontWeight: '900', color: '#111111', marginTop: 14, letterSpacing: -0.5, textAlign: 'center' },
  roleBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1C1C1E', paddingHorizontal: 20, paddingVertical: 8, 
    borderRadius: 24, marginTop: 8 
  },
  roleText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },

  walletSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    marginHorizontal: 20, borderRadius: 24, paddingVertical: 18, ...SHADOWS.sm,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#111111', marginTop: 4 },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '600' },

  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111111', marginBottom: 12 },

  // Action grid
  actionGrid: { gap: 12 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 16, ...SHADOWS.sm,
    borderWidth: 1, borderColor: '#E5E7EB'
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14, backgroundColor: '#F3F4F6' },
  actionLabel: { flex: 1, fontSize: 16, fontWeight: '800', color: '#111111' },

  // Info card
  infoCard: { 
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 4, 
    borderWidth: 1, borderColor: '#E5E7EB', ...SHADOWS.sm
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 44, height: 44, backgroundColor: '#F3F4F6', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoContent: { flex: 1 },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#111111' },
  infoLabel: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '600' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 36, marginHorizontal: 20, padding: 16, borderRadius: 24,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ef4444', ...SHADOWS.sm
  },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '900', marginLeft: 10 },
  feedbackOverlay: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    ...SHADOWS.md,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
    textAlign: 'center',
  },
});
