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
  vehicleType: 'standard' | 'premium';
  
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
  setDropoffZone: (zone: Zone) => void;
  setVehicleType: (type: 'standard' | 'premium') => void;
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
  vehicleType: 'standard',
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
  setDropoffZone: (zone) => set({ dropoffZone: zone }),
  setVehicleType: (type) => set({ vehicleType: type }),
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
    vehicleType: 'standard',
    fareEstimate: 0,
    customFareAdjust: 0,
    currentTrip: null,
    tripStatus: 'idle',
    assignedDriver: null,
  }),
}));

export default useTripStore;
