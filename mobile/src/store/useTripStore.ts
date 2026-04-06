import { create } from 'zustand';

interface Zone {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
}

interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  addressAr?: string;
}

interface TripState {
  // Location-based pickup
  pickupLocation: LocationPoint | null;
  pickupDetected: boolean;
  
  // Destination
  destination: LocationPoint | null;
  destinationQuery: string;
  
  // Zone (kept for pricing lookups)
  pickupZone: Zone | null;
  dropoffZone: Zone | null;
  // Trip settings
  // Trip settings
  vehicleType: 'standard' | 'premium' | 'shared';
  isFixedTrip: boolean; // true for static pricing, false for KM-based
  paymentType: 'cash' | 'credit';
  
  // Destinations
  stops: Zone[] | any[]; // Array of destinations
  
  // Dynamic Pricing
  hasTraffic: boolean;
  isRushHour: boolean;
  hasFuelShortage: boolean;
  
  // Fare
  fareEstimate: number;
  customFareAdjust: number; // +/- adjustment from passenger
  
  // Trip in progress
  currentTrip: any | null;
  tripStatus: 'idle' | 'selecting' | 'searching' | 'assigned' | 'arrived' | 'active' | 'completed';
  
  // Assigned driver
  assignedDriver: any | null;
  
  // Actions
  setPickupLocation: (loc: LocationPoint) => void;
  setPickupDetected: (detected: boolean) => void;
  setDestination: (loc: LocationPoint) => void;
  setDestinationQuery: (q: string) => void;
  setPickupZone: (zone: Zone) => void;
  addStop: (zone: Zone) => void;
  removeStop: (index: number) => void;
  setDropoffZone: (zone: Zone) => void;
  setVehicleType: (type: 'standard' | 'premium' | 'shared') => void;
  setIsFixedTrip: (fixed: boolean) => void;
  setPaymentType: (type: 'cash' | 'credit') => void;
  setDynamicSurge: (surge: { traffic?: boolean, rush?: boolean, fuel?: boolean }) => void;
  setFareEstimate: (fare: number) => void;
  setCustomFareAdjust: (amount: number) => void;
  setCurrentTrip: (trip: any) => void;
  setTripStatus: (status: TripState['tripStatus']) => void;
  setAssignedDriver: (driver: any) => void;
  resetTrip: () => void;
}

const useTripStore = create<TripState>((set) => ({
  pickupLocation: null,
  pickupDetected: false,
  destination: null,
  destinationQuery: '',
  pickupZone: null,
  dropoffZone: null,
  stops: [],
  vehicleType: 'standard',
  isFixedTrip: true,
  paymentType: 'cash',
  hasTraffic: false,
  isRushHour: false,
  hasFuelShortage: false,
  fareEstimate: 0,
  customFareAdjust: 0,
  currentTrip: null,
  tripStatus: 'idle',
  assignedDriver: null,
  
  setPickupLocation: (loc) => set({ pickupLocation: loc, pickupDetected: true }),
  setPickupDetected: (detected) => set({ pickupDetected: detected }),
  setDestination: (loc) => set({ destination: loc }),
  setDestinationQuery: (q) => set({ destinationQuery: q }),
  setPickupZone: (zone) => set({ pickupZone: zone }),
  addStop: (zone) => set((state) => ({ stops: [...state.stops, zone] })),
  removeStop: (index) => set((state) => ({ stops: state.stops.filter((_, i) => i !== index) })),
  setDropoffZone: (zone) => set({ dropoffZone: zone }),
  setVehicleType: (type) => set({ vehicleType: type }),
  setIsFixedTrip: (fixed) => set({ isFixedTrip: fixed }),
  setPaymentType: (type) => set({ paymentType: type }),
  setDynamicSurge: (surge) => set((state) => ({
    hasTraffic: surge.traffic ?? state.hasTraffic,
    isRushHour: surge.rush ?? state.isRushHour,
    hasFuelShortage: surge.fuel ?? state.hasFuelShortage,
  })),
  setFareEstimate: (fare) => set({ fareEstimate: fare }),
  setCustomFareAdjust: (amount) => set({ customFareAdjust: amount }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setTripStatus: (status) => set({ tripStatus: status }),
  setAssignedDriver: (driver) => set({ assignedDriver: driver }),
  resetTrip: () => set({
    pickupLocation: null,
    pickupDetected: false,
    destination: null,
    destinationQuery: '',
    pickupZone: null,
    dropoffZone: null,
    stops: [],
    vehicleType: 'standard',
    isFixedTrip: true,
    paymentType: 'cash',
    hasTraffic: false,
    isRushHour: false,
    hasFuelShortage: false,
    fareEstimate: 0,
    customFareAdjust: 0,
    currentTrip: null,
    tripStatus: 'idle',
    assignedDriver: null,
  }),
}));

export default useTripStore;
