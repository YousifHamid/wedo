import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, SafeAreaView } from 'react-native';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ChevronLeft, Clock, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

export default function DriverWalletScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const isRTL = i18n.language === 'ar';
  const walletBalance = user?.walletBalance ?? 2500;
  
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [reference, setReference] = useState('');

  // Mock transactions
  const transactions = [
    { id: 1, type: 'credit', desc: isRTL ? 'أرباح رحلة (شارع المطار)' : 'Trip earnings (Airport Road)', amount: 807, time: '14 min ago' },
    { id: 2, type: 'debit', desc: isRTL ? 'عمولة (15%)' : 'Commission (15%)', amount: -143, time: '14 min ago' },
    { id: 3, type: 'credit', desc: isRTL ? 'شحن محفظة معتمد' : 'Wallet top-up approved', amount: 15000, time: '2 hours ago' },
    { id: 4, type: 'credit', desc: isRTL ? 'أرباح رحلة (أم درمان)' : 'Trip earnings (Omdurman)', amount: 3825, time: '3 hours ago' },
    { id: 5, type: 'debit', desc: isRTL ? 'عمولة (15%)' : 'Commission (15%)', amount: -675, time: '3 hours ago' },
  ];

  const handleSubmitTopUp = () => {
    if (!topUpAmount || !reference) {
      Alert.alert(t('error'), isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    Alert.alert(t('success'), isRTL ? 'تم إرسال طلب الشحن. في انتظار موافقة الإدارة.' : 'Top-up request submitted. Awaiting admin approval.');
    setShowTopUp(false);
    setTopUpAmount('');
    setReference('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.rowReverse]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.onSurface} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('driver_wallet')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('current_balance').toUpperCase()}</Text>
          <Text style={styles.balanceAmount}>{t('sdg')} {walletBalance.toLocaleString()}</Text>
          
          <View style={styles.balanceStatus}>
            {walletBalance > 500 ? (
              <Text style={styles.balanceSufficient}>✅ {t('balance_sufficient')}</Text>
            ) : walletBalance > 0 ? (
              <Text style={styles.balanceLow}>⚠️ {t('balance_low')}</Text>
            ) : (
              <Text style={styles.balanceZero}>🚫 {t('balance_zero')}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.topUpMainBtn} onPress={() => setShowTopUp(!showTopUp)}>
            <Plus color={COLORS.onPrimary} size={18} />
            <Text style={styles.topUpMainText}>{t('top_up_wallet')}</Text>
          </TouchableOpacity>
        </View>

        {/* Top-up Form */}
        {showTopUp && (
          <View style={styles.topUpForm}>
            <Text style={styles.topUpFormTitle}>{t('top_up_wallet')}</Text>
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>{t('top_up_amount')}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.textRight]}
              placeholder="e.g. 10000"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>{t('deposit_reference')}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.textRight]}
              placeholder="REF-XXXX-X"
              value={reference}
              onChangeText={setReference}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitTopUp}>
              <Text style={styles.submitBtnText}>{t('submit_request')}</Text>
            </TouchableOpacity>
            <Text style={styles.topUpNote}>{t('top_up_instructions')}</Text>
          </View>
        )}

        {/* Transaction History */}
        <Text style={[styles.sectionTitle, isRTL && styles.textRight]}>{t('transaction_history')}</Text>
        {transactions.map((tx) => (
          <View key={tx.id} style={styles.txItem}>
            <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#e8f5e9' : '#fef2f2' }]}>
              {tx.type === 'credit' ? (
                <ArrowDownCircle color={COLORS.success} size={20} />
              ) : (
                <ArrowUpCircle color={COLORS.error} size={20} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.txDesc, isRTL && styles.textRight]}>{tx.desc}</Text>
              <Text style={[styles.txTime, isRTL && styles.textRight]}>{tx.time}</Text>
            </View>
            <Text style={[styles.txAmount, { color: tx.amount > 0 ? COLORS.success : COLORS.error }]}>
              {tx.amount > 0 ? '+' : ''}{t('sdg')} {Math.abs(tx.amount).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
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
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },

  // Balance
  balanceCard: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS.xl, padding: SPACING['2xl'], marginBottom: SPACING.xl, ...SHADOWS.md },
  balanceLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.onSurfaceVariant, letterSpacing: 1.5, marginBottom: SPACING.sm },
  balanceAmount: { fontSize: FONT_SIZES.display, fontWeight: 'bold', color: COLORS.onSurface, marginBottom: SPACING.lg },
  balanceStatus: { marginBottom: SPACING.xl },
  balanceSufficient: { fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: '600', backgroundColor: COLORS.primaryFixed, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden' },
  balanceLow: { fontSize: FONT_SIZES.sm, color: COLORS.warning, fontWeight: '600', backgroundColor: '#fff8e1', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden' },
  balanceZero: { fontSize: FONT_SIZES.sm, color: COLORS.error, fontWeight: '600', backgroundColor: '#fef2f2', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden' },
  topUpMainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: RADIUS.xl },
  topUpMainText: { color: COLORS.onPrimary, fontWeight: '700', fontSize: FONT_SIZES.md, marginLeft: 8 },

  // Top-up Form
  topUpForm: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS.xl, padding: SPACING['2xl'], marginBottom: SPACING.xl, ...SHADOWS.sm },
  topUpFormTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.onSurface, marginBottom: SPACING.xl },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.onSurfaceVariant, marginBottom: SPACING.sm },
  input: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, fontSize: FONT_SIZES.md, color: COLORS.onSurface, marginBottom: SPACING.lg },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg, borderRadius: RADIUS.xl, alignItems: 'center', marginBottom: SPACING.md },
  submitBtnText: { color: COLORS.onPrimary, fontWeight: 'bold', fontSize: FONT_SIZES.md },
  topUpNote: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, textAlign: 'center' },

  // Transactions
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.onSurface, marginBottom: SPACING.lg },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, ...SHADOWS.sm },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txDesc: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.onSurface },
  txTime: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginTop: 2 },
  txAmount: { fontSize: FONT_SIZES.md, fontWeight: 'bold' },
});
