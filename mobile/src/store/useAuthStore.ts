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
  originalRole: 'rider' | 'driver' | 'admin' | null;
  setUser: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  setServerEnabled: (enabled: boolean) => void;
  switchRole: () => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isServerEnabled: true,
      originalRole: null,
      setUser: (user, token) => set({ user, token, originalRole: user.role }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
      switchRole: () => set((state) => {
        if (!state.user) return state;
        const actualOriginalRole = state.originalRole || state.user.role;
        // Only drivers can switch between driver and rider
        if (actualOriginalRole === 'driver') {
          const newRole = state.user.role === 'driver' ? 'rider' : 'driver';
          // Dynamically change the name for testing reviewers when switching
          const newName = state.user._id?.includes('mock') 
            ? (newRole === 'driver' ? 'Reviewer Captain' : 'Reviewer Passenger')
            : state.user.name;
          return { originalRole: actualOriginalRole, user: { ...state.user, role: newRole, name: newName } };
        }
        return state;
      }),
      setServerEnabled: (enabled) => set({ isServerEnabled: enabled }),

      logout: () => set({ user: null, token: null, originalRole: null }),
    }),
    {
      name: 'wedo-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useAuthStore;
