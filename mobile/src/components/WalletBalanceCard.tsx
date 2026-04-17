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
          <Wallet color="#FFFFFF" size={24} />
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
    backgroundColor: '#FFFFFF',
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  label: { color: '#666666', fontSize: FONT_SIZES.xs, letterSpacing: 1, marginBottom: 4, fontWeight: '700' },
  amount: { color: '#000000', fontSize: FONT_SIZES['3xl'], fontWeight: '900' },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#000000', paddingVertical: 14, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg, alignSelf: 'stretch', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '900', fontSize: FONT_SIZES.md },
});

export default WalletBalanceCard;
