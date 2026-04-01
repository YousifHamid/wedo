import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { MapPin, ChevronLeft, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useTripStore from '../../store/useTripStore';
import { ZONES, ZoneItem } from '../../constants/zones';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

export default function ZoneSelectScreen({ route, navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const type = route.params?.type || 'pickup'; // 'pickup' or 'dropoff'
  const { pickupZone, dropoffZone, setPickupZone, setDropoffZone } = useTripStore();

  const selectedZone = type === 'pickup' ? pickupZone : dropoffZone;
  const title = type === 'pickup' ? t('pickup_zone') : t('dropoff_zone');

  const handleSelect = (zone: ZoneItem) => {
    if (type === 'pickup') {
      setPickupZone(zone);
    } else {
      setDropoffZone(zone);
    }
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: ZoneItem }) => {
    const isSelected = selectedZone?._id === item._id;
    return (
      <TouchableOpacity
        style={[styles.zoneItem, isSelected && styles.zoneItemActive]}
        onPress={() => handleSelect(item)}
      >
        {isSelected && <View style={styles.activeBar} />}
        <View style={[styles.zoneIconBox, isSelected && styles.zoneIconBoxActive]}>
          <MapPin color={isSelected ? COLORS.onPrimary : COLORS.onSurfaceVariant} size={20} />
        </View>
        <View style={styles.zoneInfo}>
          <Text style={[styles.zoneName, isRTL && styles.textRight]}>
            {isRTL ? item.nameAr : item.name}
          </Text>
          <Text style={[styles.zoneDesc, isRTL && styles.textRight]}>
            {isRTL ? (item.descriptionAr || item.description) : item.description}
          </Text>
        </View>
        {isSelected && (
          <View style={styles.checkCircle}>
            <Check color={COLORS.onPrimary} size={16} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isRTL && styles.rowReverse]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.onSurface} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={ZONES}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, paddingTop: 50 },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },
  listContent: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
  
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  zoneItemActive: {
    backgroundColor: COLORS.primaryFixed,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  zoneIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  zoneIconBoxActive: {
    backgroundColor: COLORS.primary,
  },
  zoneInfo: { flex: 1 },
  zoneName: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.onSurface },
  zoneDesc: { fontSize: FONT_SIZES.sm, color: COLORS.onSurfaceVariant, marginTop: 2 },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
