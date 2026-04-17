import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, SafeAreaView, ActivityIndicator, Modal } from 'react-native';
import { Wallet, ArrowUpCircle, ArrowDownCircle, ChevronLeft, Clock, Plus, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

export default function DriverWalletScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const isRTL = i18n.language === 'ar';
  
  const [walletBalance, setWalletBalance] = useState(user?.walletBalance ?? 0);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [reference, setReference] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: 'error' | 'success' }>({ visible: false, title: '', message: '', type: 'error' });

  const showCustomAlert = (title: string, message: string, type: 'error' | 'success' = 'error') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  // Fetch balance and transactions from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balRes, txRes] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/wallet/transactions'),
        ]);
        setWalletBalance(balRes.data.balance);
        updateUser({ walletBalance: balRes.data.balance });
        setTransactions(txRes.data.transactions || []);
      } catch (e) {
        console.log('[Wedo] Failed to fetch wallet data');
      } finally {
        setLoadingTx(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmitTopUp = async () => {
    if (!topUpAmount || !reference) {
      showCustomAlert(t('error'), isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields', 'error');
      return;
    }
    const amount = parseInt(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      showCustomAlert(t('error'), isRTL ? 'المبلغ غير صحيح' : 'Invalid amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/wallet/topup', { amount, reference });
      showCustomAlert(
        t('success'),
        isRTL ? 'تم إرسال طلب الشحن. في انتظار موافقة الإدارة.' : 'Top-up request submitted. Awaiting admin approval.',
        'success'
      );
      setShowTopUp(false);
      setTopUpAmount('');
      setReference('');
    } catch (error: any) {
      showCustomAlert(t('error'), error.response?.data?.message || 'Failed to submit top-up request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    return `${diffDays} days ago`;
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

            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>{isRTL ? 'الرقم المراد شحنه' : 'Phone to charge'}</Text>
            <TextInput
              style={[styles.input, isRTL && styles.textRight]}
              placeholder="09XXXXXXXX"
              keyboardType="phone-pad"
              value={user?.phone}
            />

            <Text style={[styles.inputLabel, isRTL && styles.textRight]}>{isRTL ? 'إرفاق صورة الإشعار' : 'Attach Receipt Image'}</Text>
            <TouchableOpacity style={styles.uploadBtn}>
              <Plus color={COLORS.onSurfaceVariant} size={20} />
              <Text style={styles.uploadText}>{isRTL ? 'إضافة صورة' : 'Add Image'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
              onPress={handleSubmitTopUp}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>{submitting ? '...' : t('submit_request')}</Text>
            </TouchableOpacity>
            
            <View style={styles.soonSection}>
              <Text style={styles.soonLabel}>{isRTL ? 'قريباً عبر:' : 'Coming soon via:'}</Text>
              <View style={styles.soonGrid}>
                <View style={styles.soonItem}><Text style={styles.soonText}>Bankak</Text></View>
                <View style={styles.soonItem}><Text style={styles.soonText}>MyCash</Text></View>
                <View style={styles.soonItem}><Text style={styles.soonText}>Okash</Text></View>
              </View>
            </View>
          </View>
        )}

        {/* Transaction History */}
        <Text style={[styles.sectionTitle, isRTL && styles.textRight]}>{t('transaction_history')}</Text>
        
        {loadingTx ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 20 }} />
        ) : transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock color={COLORS.outlineVariant} size={32} />
            <Text style={styles.emptyText}>
              {isRTL ? 'لا توجد معاملات بعد' : 'No transactions yet'}
            </Text>
          </View>
        ) : (
          transactions.map((tx: any) => (
            <View key={tx._id} style={styles.txItem}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#e8f5e9' : '#fef2f2' }]}>
                {tx.type === 'credit' ? (
                  <ArrowDownCircle color={COLORS.success} size={20} />
                ) : (
                  <ArrowUpCircle color={COLORS.error} size={20} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.txDesc, isRTL && styles.textRight]}>{tx.description}</Text>
                <Text style={[styles.txTime, isRTL && styles.textRight]}>{formatTime(tx.createdAt)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? COLORS.success : COLORS.error }]}>
                {tx.type === 'credit' ? '+' : '-'}{t('sdg')} {Math.abs(tx.amount).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal visible={alertConfig.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertBox}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              {alertConfig.type === 'error' ? (
                <AlertCircle color={COLORS.error} size={48} strokeWidth={1.5} />
              ) : (
                <CheckCircle color={COLORS.success} size={48} strokeWidth={1.5} />
              )}
            </View>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity 
              style={styles.alertBtn} 
              onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
              activeOpacity={0.8}
            >
              <Text style={styles.alertBtnText}>{isRTL ? 'حسنًا' : 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  balanceCard: { backgroundColor: '#FFFFFF', borderRadius: RADIUS.xl, padding: SPACING['2xl'], marginBottom: SPACING.xl, ...SHADOWS.md },
  balanceLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#666666', letterSpacing: 1.5, marginBottom: SPACING.sm },
  balanceAmount: { fontSize: FONT_SIZES.display, fontWeight: '900', color: '#000000', marginBottom: SPACING.lg },
  balanceStatus: { marginBottom: SPACING.xl },
  balanceSufficient: { fontSize: FONT_SIZES.sm, color: '#000000', fontWeight: '800', backgroundColor: '#F9F9F9', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: '#000' },
  balanceLow: { fontSize: FONT_SIZES.sm, color: '#FFFFFF', fontWeight: '800', backgroundColor: '#000000', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden' },
  balanceZero: { fontSize: FONT_SIZES.sm, color: '#FFFFFF', fontWeight: '800', backgroundColor: '#000000', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.lg, overflow: 'hidden' },
  topUpMainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', paddingVertical: SPACING.lg, borderRadius: RADIUS.xl },
  topUpMainText: { color: COLORS.onPrimary, fontWeight: '700', fontSize: FONT_SIZES.md, marginLeft: 8 },

  // Top-up Form
  topUpForm: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS.xl, padding: SPACING['2xl'], marginBottom: SPACING.xl, ...SHADOWS.sm },
  topUpFormTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: '#000000', marginBottom: SPACING.xl },
  inputLabel: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: '#000000', marginBottom: SPACING.sm },
  input: { backgroundColor: '#F9F9F9', borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, fontSize: FONT_SIZES.md, color: '#000000', marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#000000' },
  submitBtn: { backgroundColor: '#000000', paddingVertical: SPACING.lg, borderRadius: RADIUS.xl, alignItems: 'center', marginBottom: SPACING.md },
  submitBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: FONT_SIZES.md },
  topUpNote: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, textAlign: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.onSurfaceVariant, marginTop: SPACING.md },

  // Transactions
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: 'bold', color: COLORS.onSurface, marginBottom: SPACING.lg },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLowest, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, ...SHADOWS.sm },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txDesc: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.onSurface },
  txTime: { fontSize: FONT_SIZES.xs, color: COLORS.onSurfaceVariant, marginTop: 2 },
  txAmount: { fontSize: FONT_SIZES.md, fontWeight: 'bold' },

  // New form elements
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerLow, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: RADIUS.md, paddingVertical: SPACING.xl, marginBottom: SPACING.lg },
  uploadText: { color: COLORS.onSurfaceVariant, fontSize: FONT_SIZES.sm, fontWeight: '600', marginLeft: 8 },
  soonSection: { marginTop: SPACING.xl, paddingTop: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.surfaceContainerHigh },
  soonLabel: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.outlineVariant, letterSpacing: 0.5, marginBottom: SPACING.md, textAlign: 'center' },
  soonGrid: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md },
  soonItem: { backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  soonText: { fontSize: 10, color: COLORS.onSurfaceVariant, fontWeight: 'bold' },

  // Custom Alert Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  alertBox: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: RADIUS.xl, padding: SPACING['2xl'], alignItems: 'center', ...SHADOWS.lg },
  alertTitle: { fontSize: FONT_SIZES.xl, fontWeight: '900', color: '#111111', marginBottom: SPACING.md, textAlign: 'center' },
  alertMessage: { fontSize: FONT_SIZES.md, color: '#4B5563', textAlign: 'center', marginBottom: SPACING['2xl'], lineHeight: 22 },
  alertBtn: { width: '100%', backgroundColor: '#000000', paddingVertical: SPACING.lg, borderRadius: RADIUS.xl, alignItems: 'center' },
  alertBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: FONT_SIZES.md },
});
