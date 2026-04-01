import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { Phone, Lock, LogIn, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../../constants/theme';

export default function LoginScreen({ route, navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const role = route.params?.role || 'rider';
  const { setUser, isServerEnabled } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (isServerEnabled) {
      setLoading(true);
      try {
        const response = await api.post('/auth/login', { phone, password, role });
        setUser(response.data.user, response.data.token);
      } catch (error: any) {
        Alert.alert(t('error'), isRTL ? 'فشل تسجيل الدخول: تأكد من تشغيل الخادم والبيانات الصحيحة' : 'Login failed: Check server connection & credentials');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Demo Mode: Always succeed locally
    const mockData = { 
      _id: 'mock_123', 
      name: isRTL ? 'أحمد محمد' : 'Ahmed Mohamed', 
      phone: phone || '0912345678', 
      role: role,
      walletBalance: role === 'driver' ? 2500 : 5000,
      token: 'mock_token_abc' 
    };
    
    setUser(mockData as any, mockData.token);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft color={COLORS.onSurface} size={28} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, isRTL && styles.textRight]}>{t('welcome')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.textRight]}>{t('login_subtitle')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
            <Phone size={20} color={COLORS.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput 
                style={[styles.input, isRTL && styles.textRight]} 
                placeholder={t('phone_number')} 
                value={phone} 
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.outlineVariant}
            />
        </View>

        <View style={[styles.inputGroup, { marginTop: SPACING.xl }]}>
            <Lock size={20} color={COLORS.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput 
                style={[styles.input, isRTL && styles.textRight]} 
                placeholder={t('password')} 
                value={password} 
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={COLORS.outlineVariant}
            />
        </View>

        <TouchableOpacity 
          style={[styles.loginBtn, loading && { opacity: 0.7 }]} 
          onPress={handleLogin}
          disabled={loading}
        >
            <Text style={styles.loginBtnText}>{loading ? '...' : t('login')}</Text>
            {!loading && <LogIn color={COLORS.onPrimary} size={18} style={{ marginLeft: 10 }} />}
        </TouchableOpacity>

        <View style={[styles.footerContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.footerText}>{t('no_account')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp', { role })}>
              <Text style={styles.footerLink}> {t('sign_up')}</Text>
            </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface, padding: SPACING['2xl'] },
  backBtn: { marginTop: 50, marginBottom: SPACING['2xl'] },
  header: { marginBottom: SPACING['3xl'] },
  title: { fontSize: FONT_SIZES['4xl'], fontWeight: 'bold', color: COLORS.onSurface },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.onSurfaceVariant, marginTop: SPACING.sm },
  textRight: { textAlign: 'right' },
  form: { marginTop: SPACING.md },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.lg },
  inputIcon: { marginRight: SPACING.md },
  input: { flex: 1, paddingVertical: SPACING.lg, fontSize: FONT_SIZES.md, color: COLORS.onSurface },
  loginBtn: { backgroundColor: COLORS.primary, padding: SPACING.xl, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: SPACING['3xl'] },
  loginBtnText: { color: COLORS.onPrimary, fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING['2xl'] },
  footerText: { color: COLORS.onSurfaceVariant },
  footerLink: { color: COLORS.primary, fontWeight: 'bold' },
});
