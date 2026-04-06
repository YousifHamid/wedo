import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Car, UserCheck, ChevronRight, ChevronLeft, Languages, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import '../../i18n';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { isServerEnabled, setMockUser } = useAuthStore();

  const handleRoleSelect = (role: 'rider' | 'driver') => {
    navigation.navigate('Login', { role });
  };

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLng);
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgSymbol}>
         <MapPin size={width * 1.5} color={COLORS.primary} strokeWidth={0.3} />
      </View>
      <View style={styles.topSection}>
        <View style={[styles.headerRow, isRTL && { flexDirection: 'row-reverse' }]}>
           <Text style={[styles.brand, { color: '#000000' }]}>Wedo</Text>
           <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
              <Languages size={18} color={COLORS.primary} />
              <Text style={styles.langBtnText}>{i18n.language === 'ar' ? 'EN' : 'عربي'}</Text>
           </TouchableOpacity>
        </View>
        <Text style={[styles.tagline, isRTL && styles.textRight]}>{t('start_safe_trip')}</Text>
      </View>

      <View style={styles.cardContainer}>
        {/* Main Passenger Card */}
        <TouchableOpacity 
          style={[styles.roleCard, isRTL && { flexDirection: 'row-reverse' }]}
          onPress={() => handleRoleSelect('rider')}
        >
          <View style={[styles.roleAccentBar, isRTL && { left: undefined, right: 0 }]} />
          <View style={[styles.iconBox, { backgroundColor: COLORS.primaryFixed }]}>
            <Car color={COLORS.primary} size={28} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.roleTitle, isRTL && styles.textRight]}>{t('passenger')}</Text>
            <Text style={[styles.roleSub, isRTL && styles.textRight]}>{t('book_rides')}</Text>
          </View>
          {isRTL ? <ChevronLeft color={COLORS.outlineVariant} size={22} /> : <ChevronRight color={COLORS.outlineVariant} size={22} />}
        </TouchableOpacity>

        {/* Main Driver Card */}
        <TouchableOpacity 
          style={[styles.roleCard, { marginTop: SPACING.lg }, isRTL && { flexDirection: 'row-reverse' }]}
          onPress={() => handleRoleSelect('driver')}
        >
          <View style={[styles.roleAccentBar, { backgroundColor: COLORS.success }, isRTL && { left: undefined, right: 0 }]} />
          <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
            <UserCheck color={COLORS.success} size={28} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.roleTitle, isRTL && styles.textRight]}>{t('driver')}</Text>
            <Text style={[styles.roleSub, isRTL && styles.textRight]}>{t('earn_money')}</Text>
          </View>
          {isRTL ? <ChevronLeft color={COLORS.outlineVariant} size={22} /> : <ChevronRight color={COLORS.outlineVariant} size={22} />}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
          <Text style={styles.footerText}>{t('terms_notice')}</Text>
          <Text style={[styles.footerText, { marginTop: 4, opacity: 0.5 }]}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING['2xl'], overflow: 'hidden' },
  bgSymbol: { 
    position: 'absolute', top: -100, left: -width/2.5, 
    opacity: 0.04, 
  },
  topSection: { marginTop: 80, marginBottom: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: FONT_SIZES['4xl'], fontWeight: 'bold', color: COLORS.onSurface },
  langBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryFixed, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  langBtnText: { marginLeft: 6, fontWeight: 'bold', color: COLORS.primary, fontSize: FONT_SIZES.sm },
  tagline: { fontSize: FONT_SIZES.lg, color: COLORS.onSurfaceVariant, marginTop: SPACING.sm },
  textRight: { textAlign: 'right' },
  cardContainer: { flex: 1 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  roleAccentBar: { position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, backgroundColor: COLORS.primary, borderRadius: 2 },
  iconBox: { width: 56, height: 56, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.xl },
  cardContent: { flex: 1 },
  roleTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },
  roleSub: { fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant, marginTop: 4 },
  footer: { paddingVertical: SPACING.xl, alignItems: 'center' },
  footerText: { fontSize: FONT_SIZES.xs, color: COLORS.outlineVariant },
});
