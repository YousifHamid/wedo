import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { ChevronLeft, Layout, User, Car, Wallet, Search, MapPin, CheckCircle, Navigation, Terminal, Server } from 'lucide-react-native';
import useAuthStore from '../../store/useAuthStore';
import { COLORS, SPACING, RADIUS, FONT_SIZES, SHADOWS } from '../../constants/theme';

export default function DemoScreen({ navigation }: any) {
  const { setMockUser, logout, isServerEnabled, setServerEnabled } = useAuthStore();

  const navigateTo = (screen: string, role?: 'rider' | 'driver') => {
    if (role) {
      setMockUser(role);
      // Wait for state update then navigate
      setTimeout(() => {
        navigation.navigate(screen);
      }, 100);
    } else {
      navigation.navigate(screen);
    }
  };

  const ScreenItem = ({ title, icon: Icon, onPress, color = COLORS.primary }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.itemText}>{title}</Text>
      <Navigation size={18} color={COLORS.outlineVariant} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.onSurface} size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Demo / Trial Mode</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.item, { backgroundColor: isServerEnabled ? COLORS.success + '10' : COLORS.surfaceContainerLow, marginBottom: SPACING.xl }]}>
          <View style={[styles.iconContainer, { backgroundColor: isServerEnabled ? COLORS.success : COLORS.outlineVariant }]}>
            <Server size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemText, { marginBottom: 2 }]}>Live Server Mode</Text>
            <Text style={{ fontSize: 11, color: COLORS.onSurfaceVariant }}>{isServerEnabled ? 'Connected to 10.249.115.105' : 'Offline Mock Mode (Default)'}</Text>
          </View>
          <TouchableOpacity 
            style={{ backgroundColor: isServerEnabled ? COLORS.success : COLORS.outlineVariant, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md }}
            onPress={() => setServerEnabled(!isServerEnabled)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isServerEnabled ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Auth Flow</Text>
        <ScreenItem title="Fast Intro" icon={Layout} onPress={() => navigateTo('Intro')} />
        <ScreenItem title="Welcome Screen" icon={Layout} onPress={() => navigateTo('Welcome')} />
        <ScreenItem title="Login (Rider)" icon={User} onPress={() => navigateTo('Login', 'rider')} />
        <ScreenItem title="Login (Driver)" icon={Car} onPress={() => navigateTo('Login', 'driver')} />
        <ScreenItem title="Sign Up" icon={User} onPress={() => navigateTo('SignUp')} />

        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Rider Screens</Text>
        <ScreenItem title="Rider Home" icon={MapPin} onPress={() => navigateTo('UserHome', 'rider')} />
        <ScreenItem title="Zone Selection" icon={MapPin} onPress={() => navigateTo('ZoneSelect', 'rider')} />
        <ScreenItem title="Searching for Driver" icon={Search} onPress={() => navigateTo('Searching', 'rider')} />
        <ScreenItem title="Trip Status" icon={Navigation} onPress={() => navigateTo('TripStatus', 'rider')} />
        <ScreenItem title="Trip Complete" icon={CheckCircle} onPress={() => navigateTo('TripComplete', 'rider')} />

        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Driver Screens</Text>
        <ScreenItem title="Driver Home" icon={Car} onPress={() => navigateTo('DriverHome', 'driver')} color={COLORS.success} />
        <ScreenItem title="Driver Wallet" icon={Wallet} onPress={() => navigateTo('DriverWallet', 'driver')} color={COLORS.success} />

        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Common</Text>
        <ScreenItem title="Profile" icon={User} onPress={() => navigateTo('Profile', 'rider')} />
        
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => {
            logout();
            navigation.navigate('Welcome');
          }}
        >
          <Text style={styles.logoutBtnText}>Reset Demo State</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerLow
  },
  backBtn: { marginRight: SPACING.md },
  title: { fontSize: FONT_SIZES.xl, fontWeight: 'bold', color: COLORS.onSurface },
  scrollContent: { padding: SPACING.xl },
  sectionTitle: { 
    fontSize: FONT_SIZES.sm, 
    fontWeight: 'bold', 
    color: COLORS.outlineVariant, 
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg
  },
  itemText: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.onSurface, fontWeight: '500' },
  logoutBtn: {
    marginTop: SPACING['3xl'],
    backgroundColor: COLORS.error + '15',
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: 'center'
  },
  logoutBtnText: { color: COLORS.error, fontWeight: 'bold', fontSize: FONT_SIZES.md }
});
