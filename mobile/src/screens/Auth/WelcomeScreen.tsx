import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Car, UserCheck, ChevronRight, Languages, MapPin, Eye, Layout } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import '../../i18n';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const setMockUser = useAuthStore(state => state.setMockUser);

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
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <TouchableOpacity onPress={() => navigation.navigate('Demo')} style={[styles.langBtn, { marginRight: 8, backgroundColor: COLORS.surfaceContainerHigh }]}>
                <Layout size={18} color={COLORS.info} />
                <Text style={[styles.langBtnText, { color: COLORS.info }]}>Demo</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
                <Languages size={18} color={COLORS.primary} />
                <Text style={styles.langBtnText}>{i18n.language === 'ar' ? 'EN' : 'عربي'}</Text>
             </TouchableOpacity>
           </View>
        </View>
        <Text style={[styles.tagline, isRTL && styles.textRight]}>{t('start_safe_trip')}</Text>
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.roleCard}
          onPress={() => navigation.navigate('Login', { role: 'rider' })}
        >
          <View style={styles.roleAccentBar} />
          <View style={[styles.iconBox, { backgroundColor: COLORS.primaryFixed }]}>
            <Car color={COLORS.primary} size={28} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.roleTitle, isRTL && styles.textRight]}>{t('passenger')}</Text>
            <Text style={[styles.roleSub, isRTL && styles.textRight]}>{t('book_rides')}</Text>
          </View>
          <ChevronRight color={COLORS.outlineVariant} size={22} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.roleCard, { marginTop: SPACING.xl }]}
          onPress={() => navigation.navigate('Login', { role: 'driver' })}
        >
          <View style={[styles.roleAccentBar, { backgroundColor: COLORS.success }]} />
          <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
            <UserCheck color={COLORS.success} size={28} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.roleTitle, isRTL && styles.textRight]}>{t('driver')}</Text>
            <Text style={[styles.roleSub, isRTL && styles.textRight]}>{t('earn_money')}</Text>
          </View>
          <ChevronRight color={COLORS.outlineVariant} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
          <View style={styles.mockReviewRow}>
            <TouchableOpacity 
              style={styles.reviewBtn}
              onPress={() => {
                setMockUser('rider');
                setTimeout(() => {
                  navigation.reset({ index: 0, routes: [{ name: 'UserHome' }] });
                }, 100);
              }}
            >
              <Eye size={16} color={COLORS.primary} />
              <Text style={styles.reviewBtnText}>{isRTL ? 'معاينة كراكب' : 'Review Rider'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.reviewBtn, { marginLeft: 10 }]}
              onPress={() => {
                setMockUser('driver');
                setTimeout(() => {
                  navigation.reset({ index: 0, routes: [{ name: 'DriverHome' }] });
                }, 100);
              }}
            >
              <Eye size={16} color={COLORS.success} />
              <Text style={[styles.reviewBtnText, { color: COLORS.success }]}>{isRTL ? 'معاينة ككابتن' : 'Review Captain'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerText}>{t('terms_notice')}</Text>
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
  mockReviewRow: { flexDirection: 'row', marginBottom: SPACING.lg },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, ...SHADOWS.sm },
  reviewBtnText: { marginLeft: 6, fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.primary },
  footerText: { fontSize: FONT_SIZES.xs, color: COLORS.outlineVariant },
});
