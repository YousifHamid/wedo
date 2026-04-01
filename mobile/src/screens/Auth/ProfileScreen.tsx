import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import WalletBalanceCard from '../../components/WalletBalanceCard';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';
import { Phone, Mail, Car, Settings, LogOut, ChevronLeft, ChevronRight, Star, Wallet, Clock, TrendingUp } from 'lucide-react-native';

export default function ProfileScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user, logout, setUser, token } = useAuthStore();
  const isDriver = user?.role === 'driver';
  const [loading, setLoading] = useState(false);

  // Sync profile data from server on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        if (response.data.user) {
          // Keep the token we have, update user data
          setUser(response.data.user, token as string);
        }
      } catch (e) {
        console.log('[Wedo] Profile sync failed');
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logout_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), onPress: () => logout(), style: 'destructive' },
    ]);
  };

  const getRelativeValue = (val: number | undefined) => {
    if (val === undefined || val === null) return '0';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={[styles.headerBar, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.onSurface} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Avatar + Name */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${user?.name}&background=00603e&color=fff&size=128` }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editBtn}>
            <Settings color="#fff" size={16} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {isDriver ? t('driver').toUpperCase() : t('passenger').toUpperCase()}
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
          <Star color="#f59e0b" fill="#f59e0b" size={20} />
          <Text style={styles.statValue}>{user?.reliabilityScore ? (user.reliabilityScore / 20).toFixed(2) : '5.00'}</Text>
          <Text style={styles.statLabel}>{t('rating')}</Text>
        </View>
        <View style={[styles.statItem, styles.statDivider]}>
          <Text style={styles.statValue}>{user?.totalTrips || 0}</Text>
          <Text style={styles.statLabel}>{isDriver ? t('trips_count') : t('rides_count')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
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
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('DriverWallet')}>
              <View style={[styles.actionIcon, { backgroundColor: '#e8f5e9' }]}>
                <Wallet color={COLORS.primary} size={24} />
              </View>
              <Text style={styles.actionLabel}>{t('tab_wallet')}</Text>
              <ChevronRight color={COLORS.outlineVariant} size={18} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#fff3e0' }]}>
              <Clock color={COLORS.warning} size={24} />
            </View>
            <Text style={styles.actionLabel}>{t('tab_trips')}</Text>
            <ChevronRight color={COLORS.outlineVariant} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>{t('account_info')}</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Mail color={COLORS.onSurfaceVariant} size={20} /></View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoValue, isRTL && { textAlign: 'right' }]}>{user?.email || '---'}</Text>
              <Text style={[styles.infoLabel, isRTL && { textAlign: 'right' }]}>{t('email_address')}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderColor: COLORS.surfaceContainerLow }]}>
            <View style={styles.iconBox}><Phone color={COLORS.onSurfaceVariant} size={20} /></View>
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
              <View style={styles.iconBox}><Car color={COLORS.onSurfaceVariant} size={20} /></View>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingTop: 55, paddingBottom: SPACING.md,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },

  header: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: { width: 100, height: 100, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.surfaceContainerLowest },
  editBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.surfaceContainerLowest },
  userName: { fontSize: FONT_SIZES['2xl'], fontWeight: 'bold', color: COLORS.onSurface, marginTop: 12 },
  roleBadge: { backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  roleText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 1 },

  walletSection: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },

  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.surfaceContainerLowest,
    marginHorizontal: 20, borderRadius: RADIUS.xl, paddingVertical: 18, ...SHADOWS.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.surfaceContainerLow },
  statValue: { fontSize: FONT_SIZES.md, fontWeight: 'bold', color: COLORS.onSurface, marginTop: 4 },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginTop: 2 },

  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.onSurface, marginBottom: 12 },

  // Action grid
  actionGrid: { gap: 8 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS.xl,
    padding: 16, ...SHADOWS.sm,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionLabel: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },

  // Info card
  infoCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS.xl, padding: 4, ...SHADOWS.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 40, height: 40, backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoContent: { flex: 1 },
  infoValue: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.onSurface },
  infoLabel: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 36, marginHorizontal: 20, padding: 16, borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceContainerLowest, borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { color: COLORS.error, fontSize: FONT_SIZES.md, fontWeight: 'bold', marginLeft: 10 },
});
