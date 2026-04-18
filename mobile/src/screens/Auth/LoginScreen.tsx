import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Modal,
} from 'react-native';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import { validateDemoLogin, formatRemainingTime } from '../../services/demoGuard';
import { Phone, Lock, LogIn, ChevronLeft, Clock, ShieldOff, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../../constants/theme';

// ─── Demo Block Modal ──────────────────────────────────────────────────────────
type BlockReason = 'expired' | 'device_locked' | null;

function DemoBlockModal({ reason, onClose }: { reason: BlockReason; onClose: () => void }) {
  if (!reason) return null;

  const isExpired = reason === 'expired';

  return (
    <Modal transparent animationType="fade" visible={!!reason}>
      <View style={modal.overlay}>
        <View style={modal.card}>
          <View style={[modal.iconBg, { backgroundColor: isExpired ? '#ff6b0020' : '#e53e3e20' }]}>
            {isExpired
              ? <Clock size={40} color="#ff6b00" />
              : <Smartphone size={40} color="#e53e3e" />
            }
          </View>

          <Text style={modal.title}>
            {isExpired ? '⏰ Demo Expired' : '🔒 Access Denied'}
          </Text>

          <Text style={modal.message}>
            {isExpired
              ? 'Your 24-hour demo access has ended.\nContact the Wedo team to request a new session.'
              : 'This demo account is already active on another device.\nEach account can only be used on one device.'
            }
          </Text>

          <Text style={modal.contact}>📩 Contact: support@wedo.app</Text>

          <TouchableOpacity style={modal.btn} onPress={onClose}>
            <Text style={modal.btnText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
export default function LoginScreen({ route, navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const role = route.params?.role || 'rider';
  const { setUser, isServerEnabled, savedCredentials, saveCredentials } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [blockReason, setBlockReason] = useState<BlockReason>(null);

  // ✅ Auto-fill saved credentials on mount
  useEffect(() => {
    if (savedCredentials && savedCredentials.role === role) {
      setPhone(savedCredentials.phone);
      setPassword(savedCredentials.password);
    }
  }, []);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert(t('error'), isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }

    setLoading(true);

    // ── MASTER ACCESS — permanent, no expiry, any device ───────────────────
    if (phone.trim() === '0115222228' && password.trim() === '11223344') {
      const masterUser = {
        _id: `master_${role}`,
        name: role === 'rider' ? 'Demo Passenger' : 'Demo Captain',
        phone: '0115222228',
        role: role,
        walletBalance: 50000,
        isOnline: true,
        driverStatus: 'active' as const,
        reliabilityScore: 98,
        totalTrips: 142,
        totalEarnings: 280000,
        vehicleDetails: role === 'driver' ? {
          make: 'Toyota', model: 'Corolla',
          year: '2022', color: 'White', plateNumber: 'KRT-5588',
        } : undefined,
      };
      setUser(masterUser as any, 'master_token_permanent');
      // ✅ Always save credentials
      saveCredentials({ phone: phone.trim(), password: password.trim(), role: role as 'rider' | 'driver' });
      try { connectSocket(); } catch (e) {}
      setLoading(false);
      return;
    }

    // ── Step 1: Check demo guard ────────────────────────────────────────────
    try {
      // Pass the current screen role — each account works as rider OR driver
      const demo = await validateDemoLogin(phone.trim(), password.trim(), role as 'rider' | 'driver');

      if (demo.status === 'expired') {
        setBlockReason('expired');
        setLoading(false);
        return;
      }

      if (demo.status === 'device_locked') {
        setBlockReason('device_locked');
        setLoading(false);
        return;
      }

      if (demo.status === 'ok') {
        const { account, remainingMs } = demo;
        // Use the screen role (rider/driver), not a fixed account role
        const mockUser = {
          _id: `mock_${account.id}_${role}`,
          name: role === 'rider' ? 'Demo Passenger' : 'Demo Captain',
          phone: account.phone,
          role: role as 'rider' | 'driver',
          walletBalance: 50000,
          isOnline: true,
          driverStatus: 'active' as const,
          reliabilityScore: 98,
          totalTrips: 142,
          totalEarnings: 280000,
          vehicleDetails: role === 'driver' ? {
            make: 'Toyota',
            model: 'Corolla',
            year: '2022',
            color: 'White',
            plateNumber: 'KRT-5588',
          } : undefined,
        };
        setUser(mockUser as any, `mock_token_${account.id}_${role}`);
        // ✅ Always save credentials
        saveCredentials({ phone: phone.trim(), password: password.trim(), role: role as 'rider' | 'driver' });
        try { connectSocket(); } catch (e) {}

        Alert.alert(
          '✅ Demo Access',
          `Welcome! ${formatRemainingTime(remainingMs)}`,
          [{ text: 'Let\'s go!', style: 'default' }]
        );
        setLoading(false);
        return;
      }

      // status === 'not_demo' → fall through to server login below
    } catch (e) {
      // Guard error — still try server
    }

    // ── Step 2: Standard server login ──────────────────────────────────────
    if (isServerEnabled) {
      try {
        const response = await api.post('/auth/login', { phone, password, role });
        const { user, token } = response.data;
        setUser(user, token);
        // ✅ Always save credentials after real server login
        saveCredentials({ phone: phone.trim(), password: password.trim(), role: role as 'rider' | 'driver' });
        connectSocket();
      } catch (error: any) {
        const status = error.response?.status;
        const serverMsg = error.response?.data?.message;
        const actualRole = error.response?.data?.actualRole;

        // ── 403: Wrong login screen (role mismatch) ──
        if (status === 403) {
          const wrongScreenMsg = actualRole === 'driver'
            ? (isRTL
              ? 'هذا الحساب خاص بالكابتن. يرجى استخدام شاشة دخول الكابتن.'
              : 'This is a Captain account. Please login from the Captain screen.')
            : (isRTL
              ? 'هذا الحساب خاص بالزبون. يرجى استخدام شاشة دخول الزبون.'
              : 'This is a Rider account. Please login from the Rider screen.');
          Alert.alert(
            isRTL ? '⚠️ شاشة الدخول خطأ' : '⚠️ Wrong Login Screen',
            wrongScreenMsg,
            [{ text: isRTL ? 'حسناً' : 'OK', style: 'default' }]
          );
        } else {
          Alert.alert(
            t('error'),
            serverMsg || (isRTL
              ? 'فشل تسجيل الدخول: تأكد من البيانات الصحيحة وتشغيل الخادم'
              : 'Login failed: Check your credentials and server connection')
          );
        }
      }
    } else {
      Alert.alert(
        t('error'),
        isRTL ? 'البيانات غير صحيحة' : 'Invalid credentials'
      );
    }

    setLoading(false);
  };

  return (
    <>
      <DemoBlockModal reason={blockReason} onClose={() => setBlockReason(null)} />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#FFFFFF" size={28} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, isRTL && { textAlign: 'right' }]}>{t('welcome')}</Text>
          <Text style={[styles.subtitle, isRTL && { textAlign: 'right' }]}>{t('login_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Phone size={20} color="#374151" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isRTL && styles.textRight]}
              placeholder={t('phone_number')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={[styles.inputGroup, { marginTop: SPACING.xl }]}>
            <Lock size={20} color="#374151" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, isRTL && styles.textRight]}
              placeholder={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Remember Me — always on, shown as info only */}
          <View style={[styles.rememberContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.checkbox, styles.checkboxActive]}>
              <LogIn size={12} color="#000" strokeWidth={3} />
            </View>
            <Text style={styles.rememberText}>{isRTL ? 'حفظ بيانات الدخول دائماً ✔' : 'Login info always saved ✔'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>{loading ? '...' : t('login')}</Text>
            {!loading && <LogIn color="#000000" size={20} style={[isRTL ? { marginRight: 10 } : { marginLeft: 10 }]} />}
          </TouchableOpacity>

          <View style={[styles.footerContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.footerText}>{t('no_account')}</Text>
            <TouchableOpacity onPress={() =>
              Alert.alert(
                isRTL ? '🔒 غير متاح' : '🔒 Not Available',
                isRTL
                  ? 'إنشاء حساب غير متاح حالياً.\nلديك بالفعل بيانات دخول تجريبية خاصة بك.'
                  : 'Sign up is not available right now.\nYou already have a demo login provided to you.',
                [{ text: isRTL ? 'حسناً' : 'Got it', style: 'default' }]
              )
            }>
              <Text style={styles.footerLink}> {t('sign_up')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1B1F', padding: SPACING['2xl'] },
  backBtn: { marginTop: 50, marginBottom: SPACING['2xl'], width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: SPACING['3xl'] },
  title: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#9CA3AF', marginTop: SPACING.sm },
  textRight: { textAlign: 'right' },
  form: { marginTop: SPACING.md },
  inputGroup: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: SPACING.xl, 
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  inputIcon: { marginRight: SPACING.md },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: '#000000', fontWeight: '700' },
  rememberContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#4B5563', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  checkboxActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  rememberText: { color: '#E5E7EB', fontSize: 15, fontWeight: '600', paddingHorizontal: 12 },
  loginBtn: { 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: RADIUS.full, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    marginTop: 40 
  },
  loginBtnText: { color: '#000000', fontSize: 18, fontWeight: '800' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING['2xl'] },
  footerText: { color: '#9CA3AF', fontSize: 15 },
  footerLink: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  card: { 
    backgroundColor: '#1C1C1E', 
    borderRadius: 32, 
    padding: 32, 
    alignItems: 'center', 
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20
  },
  iconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  title: { fontSize: 24, fontWeight: '900', color: '#ffffff', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  message: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', lineHeight: 24, marginBottom: 16, fontWeight: '500' },
  contact: { fontSize: 13, color: '#6B7280', marginBottom: 24, fontWeight: 'bold' },
  btn: { 
    backgroundColor: '#FFFFFF', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 30,
    shadowColor: '#FFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
  },
  btnText: { color: '#000000', fontWeight: '900', fontSize: 16 },
});
