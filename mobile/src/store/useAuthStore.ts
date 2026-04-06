import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  profilePicture?: string;
  role: 'rider' | 'driver' | 'admin';
  walletBalance?: number;
  currentZone?: string;
  vehicleDetails?: {
    make: string;
    model: string;
    year?: string;
    color?: string;
    plateNumber: string;
  };
  driverStatus?: 'pending' | 'active' | 'blocked' | 'suspended';
  reliabilityScore?: number;
  totalTrips?: number;
  totalEarnings?: number;
  isOnline?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isServerEnabled: boolean;
  setUser: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  setServerEnabled: (enabled: boolean) => void;
  setMockUser: (role: 'rider' | 'driver') => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isServerEnabled: false, // Default to offline/mock mode for demo
      setUser: (user, token) => set({ user, token }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
      setServerEnabled: (enabled) => set({ isServerEnabled: enabled }),
      setMockUser: (role) => {
        const mockUser: User = {
          _id: `mock_${role}_123`,
          name: role === 'rider' ? 'Guest Rider' : 'Guest Captain',
          phone: '0912345678',
          role: role,
          walletBalance: 15000,
          isOnline: true,
          driverStatus: 'active',
        };
        set({ user: mockUser, token: 'mock_token_abc' });
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'wedo-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAuthStore;
