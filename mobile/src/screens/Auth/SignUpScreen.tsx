import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import useAuthStore from '../../store/useAuthStore';
import * as Location from 'expo-location';
import { Phone, Lock, ChevronLeft, UserPlus, User, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../../constants/theme';

export default function SignUpScreen({ route, navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const role = route.params?.role || 'rider';
  const { setUser } = useAuthStore();

  const handleDetectLocation = async () => {
    setDetecting(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('error'), isRTL ? 'الرجاء السماح بالوصول للموقع' : 'Please allow location access');
        setDetecting(false);
        return;
      }
      await Location.getCurrentPositionAsync({});
      setLocationGranted(true);
    } catch (error) {
      Alert.alert(t('error'), isRTL ? 'فشل تحديد الموقع' : 'Failed to detect location');
    } finally {
      setDetecting(false);
    }
  };

  const handleSignUp = async () => {
    if (!name || !phone || !password) {
      Alert.alert(t('error'), isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }
    if (!locationGranted) {
      Alert.alert(t('error'), t('location_required'));
      return;
    }

    const mockData = { 
      _id: 'mock_new_user', 
      name: name, 
      phone: phone, 
      role: role,
      walletBalance: role === 'driver' ? 0 : 0,
      token: 'mock_token_register_123' 
    };
    
    setUser(mockData as any, mockData.token);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft color={COLORS.onSurface} size={28} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, isRTL && styles.textRight]}>{t('sign_up')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.textRight]}>{t('signup_subtitle')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
            <User size={20} color={COLORS.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput 
                style={[styles.input, isRTL && styles.textRight]} 
                placeholder={t('full_name')} 
                value={name} 
                onChangeText={setName}
                placeholderTextColor={COLORS.outlineVariant}
            />
        </View>

        <View style={[styles.inputGroup, { marginTop: SPACING.xl }]}>
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
           style={[styles.locationBtn, locationGranted && styles.locationBtnSuccess]} 
           onPress={handleDetectLocation}
           disabled={locationGranted || detecting}
        >
            <MapPin color={locationGranted ? COLORS.onPrimary : COLORS.primary} size={20} style={{ marginRight: 10 }} />
            <Text style={[styles.locationBtnText, locationGranted && { color: COLORS.onPrimary }]}>
                {detecting ? t('location_detecting') : locationGranted ? t('location_verified') : t('location_detect')}
            </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signUpBtn} onPress={handleSignUp}>
            <Text style={styles.signUpBtnText}>{t('sign_up')}</Text>
            <UserPlus color={COLORS.onPrimary} size={18} style={{ marginLeft: 10 }} />
        </TouchableOpacity>

        <View style={[styles.footerContainer, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={styles.footerText}>{t('already_have_account')}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
               <Text style={styles.footerLink}> {t('login')}</Text>
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
  locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryFixed, padding: SPACING.lg, borderRadius: RADIUS.lg, marginTop: SPACING.xl },
  locationBtnSuccess: { backgroundColor: COLORS.success },
  locationBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: 'bold' },
  signUpBtn: { backgroundColor: COLORS.primary, padding: SPACING.xl, borderRadius: RADIUS.xl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: SPACING['2xl'] },
  signUpBtnText: { color: COLORS.onPrimary, fontSize: FONT_SIZES.lg, fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING['2xl'] },
  footerText: { color: COLORS.onSurfaceVariant },
  footerLink: { color: COLORS.primary, fontWeight: 'bold' },
});
