import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../constants/theme';

interface Props {
  balance: number;
  onTopUp?: () => void;
}

const WalletBalanceCard = ({ balance, onTopUp }: Props) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>{t('wallet_balance').toUpperCase()}</Text>
          <Text style={styles.amount}>{t('sdg')} {balance.toLocaleString()}</Text>
        </View>
        <View style={styles.icon}>
          <Wallet color={COLORS.onPrimary} size={20} />
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={onTopUp}>
        <Text style={styles.buttonText}>{t('add_funds')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.dark,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  label: { color: '#aaa', fontSize: FONT_SIZES.xs, letterSpacing: 1, marginBottom: 4 },
  amount: { color: '#fff', fontSize: FONT_SIZES['3xl'], fontWeight: 'bold' },
  icon: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryContainer, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#333', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.sm, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: FONT_SIZES.sm },
});

export default WalletBalanceCard;
