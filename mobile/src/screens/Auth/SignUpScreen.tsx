import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import useAuthStore from '../../store/useAuthStore';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Phone, Lock, ChevronLeft, UserPlus, User, MapPin, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, RADIUS, FONT_SIZES } from '../../constants/theme';

export default function SignUpScreen({ route, navigation }: any) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
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
    if (!name.trim() || !phone.trim() || !password.trim()) {
      Alert.alert(t('error'), isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }
    if (role === 'driver' && !profileImage) {
      Alert.alert(t('error'), isRTL ? 'صورة الشخصية إلزامية للسائق' : 'Profile image is mandatory for drivers');
      return;
    }
    if (!locationGranted) {
      Alert.alert(t('error'), t('location_required'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('error'), isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name,
        phone,
        password,
        role,
      });
      const { user, token } = response.data;
      setUser(user, token);
      connectSocket();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      Alert.alert(
        t('error'),
        msg || (isRTL ? 'فشل إنشاء الحساب. حاول مرة أخرى.' : 'Sign up failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert(isRTL ? 'خطأ' : 'Error', isRTL ? 'حدث خطأ أثناء فتح المعرض. يرجى تثبيت expo-image-picker.' : 'Failed to open gallery.');
    }
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

      {/* Profile Image Section */}
      <View style={styles.imageSection}>
        <TouchableOpacity 
          style={[styles.imageCircle, role === 'driver' && !profileImage && { borderColor: COLORS.error }]} 
          onPress={handlePickImage}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={{ width: '100%', height: '100%', borderRadius: 50 }} />
          ) : (
            <View style={styles.imagePlaceholder}>
               <User size={40} color={COLORS.outlineVariant} />
               <Text style={styles.imageLabel}>{isRTL ? 'صورة البروفايل' : 'Profile Image'}</Text>
               {role === 'driver' && <Text style={styles.mandatoryText}>*{isRTL ? 'إلزامية' : 'Mandatory'}</Text>}
            </View>
          )}
        </TouchableOpacity>
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

        <TouchableOpacity 
          style={[styles.signUpBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSignUp}
          disabled={loading}
        >
            <Text style={styles.signUpBtnText}>{loading ? '...' : t('sign_up')}</Text>
            {!loading && <UserPlus color={COLORS.onPrimary} size={18} style={[isRTL ? { marginRight: 10 } : { marginLeft: 10 }]} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.signUpBtn, { marginTop: SPACING.md }]}
          activeOpacity={0.7}
          onPress={() => Alert.alert(isRTL ? 'قريباً' : 'Coming Soon', isRTL ? 'ميزة الدخول عبر البريد ستتوفر قريباً' : 'Email login will be available soon')}
        >
          <Text style={styles.signUpBtnText}>{isRTL ? 'أو التسجيل عبر الايميل' : 'Or Register via Email'}</Text>
          <Mail color={COLORS.onPrimary} size={24} style={isRTL ? { marginRight: 20 } : { marginLeft: 20 }} />
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
  
  // Image styles
  imageSection: { alignItems: 'center', marginBottom: SPACING.xl },
  imageCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.surfaceContainerLow, borderWidth: 2, borderColor: COLORS.outlineVariant, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imagePlaceholder: { alignItems: 'center' },
  imageLabel: { fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 4, fontWeight: '600' },
  imageBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  mandatoryText: { fontSize: 9, color: COLORS.error, fontWeight: '700', marginTop: 2 },
});
