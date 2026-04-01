import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  email?: string;
  phone: string;
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
  isMock: boolean;
  isServerEnabled: boolean;
  setUser: (user: User, token: string) => void;
  setMockUser: (role: 'rider' | 'driver') => void;
  setServerEnabled: (enabled: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isMock: false,
  isServerEnabled: false,
  setUser: (user, token) => set({ user, token, isMock: false }),
  setServerEnabled: (enabled) => set({ isServerEnabled: enabled }),
  setMockUser: (role) => {
    const mockUser: User = {
      _id: 'mock_user_123',
      name: role === 'driver' ? 'Mock Captain' : 'Mock Rider',
      email: role === 'driver' ? 'captain@wedo.sd' : 'rider@wedo.sd',
      phone: '0912345678',
      role: role,
      walletBalance: role === 'driver' ? 1500 : 2500,
      currentZone: 'Bahri',
      isOnline: role === 'driver' ? true : false,
      driverStatus: role === 'driver' ? 'active' : undefined,
      reliabilityScore: 4.95,
      totalTrips: role === 'driver' ? 254 : 48,
      totalEarnings: role === 'driver' ? 154200 : undefined,
      vehicleDetails: role === 'driver' ? {
        make: 'Toyota',
        model: 'Corolla',
        year: '2020',
        plateNumber: '12345-A'
      } : undefined
    };
    set({ user: mockUser, token: 'mock_token', isMock: true });
  },
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
  logout: () => set({ user: null, token: null, isMock: false }),
}));

export default useAuthStore;
