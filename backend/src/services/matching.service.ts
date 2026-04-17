import User, { UserRole } from '../models/User';
import Trip, { TripStatus } from '../models/Trip';
import Pricing from '../models/Pricing';
import mongoose from 'mongoose';

/**
 * Sequential Dispatch Matching Engine
 * 
 * Finds the best driver for a trip based on:
 * 1. Zone match (driver's currentZone matches pickup zone)
 * 2. Online status
 * 3. Wallet threshold (balance > 0)
 * 4. Reliability score (higher = better priority)
 * 5. Wallet balance (higher = better priority)
 * 
 * Returns drivers one at a time for sequential dispatch.
 */

export interface MatchCandidate {
  driverId: string;
  name: string;
  phone: string;
  reliabilityScore: number;
  walletBalance: number;
  vehicleDetails: any;
  rating?: number;
}

// Get ordered list of driver candidates for a trip
export const findMatchCandidates = async (
  pickupZoneId: string,
  excludeDriverIds: string[] = []
): Promise<MatchCandidate[]> => {
  const excludeObjectIds = excludeDriverIds.map(id => new mongoose.Types.ObjectId(id));

  const candidates = await User.find({
    role: UserRole.DRIVER,
    isOnline: true,
    driverStatus: 'active',
    isBusy: false,
    walletBalance: { $gt: 0 },
    currentZone: pickupZoneId,
    _id: { $nin: excludeObjectIds },
  })
    .sort({ reliabilityScore: -1, walletBalance: -1 })
    .limit(20)
    .select('name phone reliabilityScore walletBalance vehicleDetails');

  return candidates.map(d => ({
    driverId: d._id.toString(),
    name: d.name,
    phone: d.phone,
    reliabilityScore: d.reliabilityScore,
    walletBalance: d.walletBalance,
    vehicleDetails: d.vehicleDetails,
  }));
};

// Get the next driver to dispatch to (sequential)
export const getNextDriver = async (tripId: string): Promise<MatchCandidate | null> => {
  const trip = await Trip.findById(tripId);
  if (!trip) return null;

  // Get IDs of drivers already attempted
  const attemptedDriverIds = trip.dispatchAttempts.map(a => a.driver.toString());

  const candidates = await findMatchCandidates(
    trip.pickupZone.toString(),
    attemptedDriverIds
  );

  return candidates.length > 0 ? candidates[0] : null;
};

// Record a dispatch attempt
export const recordDispatchAttempt = async (
  tripId: string,
  driverId: string,
  response: 'accepted' | 'rejected' | 'timeout'
) => {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new Error('Trip not found');

  // Find and update the dispatch attempt
  const attempt = trip.dispatchAttempts.find(
    a => a.driver.toString() === driverId && !a.respondedAt
  );

  if (attempt) {
    attempt.respondedAt = new Date();
    attempt.response = response;
  }

  if (response === 'accepted') {
    trip.driver = new mongoose.Types.ObjectId(driverId);
    trip.status = TripStatus.ACCEPTED;
    trip.currentDispatchDriver = undefined;
  } else if (response === 'rejected' || response === 'timeout') {
    trip.currentDispatchDriver = undefined;

    // Update driver reliability score for timeout
    if (response === 'timeout') {
      await User.findByIdAndUpdate(driverId, {
        $inc: { reliabilityScore: -2 } // Small penalty for timeout
      });
    }
  }

  await trip.save();
  return trip;
};

// Start sequential dispatch for a trip
export const startDispatch = async (tripId: string): Promise<MatchCandidate | null> => {
  const trip = await Trip.findById(tripId);
  if (!trip) return null;

  const nextDriver = await getNextDriver(tripId);
  if (!nextDriver) {
    // No drivers available
    trip.status = TripStatus.CANCELLED;
    await trip.save();
    return null;
  }

  // Record the dispatch attempt
  trip.dispatchAttempts.push({
    driver: new mongoose.Types.ObjectId(nextDriver.driverId),
    sentAt: new Date(),
  });
  trip.currentDispatchDriver = new mongoose.Types.ObjectId(nextDriver.driverId);
  trip.status = TripStatus.DISPATCHING;
  await trip.save();

  return nextDriver;
};

// Haversine formula to calculate distance between two coordinates in KM
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get fare for a zone pair
export const getFareEstimate = async (
  fromZoneId: string,
  toZoneId: string,
  vehicleType: 'standard' | 'premium' = 'standard'
): Promise<{ fare: number; commissionRate: number } | null> => {
  const pricing = await Pricing.findOne({
    fromZone: fromZoneId,
    toZone: toZoneId,
    isActive: true,
  });

  if (pricing) {
    return {
      fare: vehicleType === 'premium' ? pricing.premiumFare : pricing.baseFare,
      commissionRate: pricing.commissionRate,
    };
  }

  // Fallback: Calculate semi-realistic fare based on zone coordinates
  const Zone = mongoose.model('Zone');
  const fromZone = await Zone.findById(fromZoneId);
  const toZone = await Zone.findById(toZoneId);

  if (fromZone && toZone && (fromZone as any).lat && (toZone as any).lat) {
     const distanceKm = calculateDistance(
        (fromZone as any).lat, (fromZone as any).lng, 
        (toZone as any).lat, (toZone as any).lng
     );
     
     // SUDAN SEMI-REALISTIC CALCULATION:
     // Base rate: 750 (std) or 1200 (premium) per KM
     // Base pickup: 2000 (std) or 3500 (premium)
     const perKm = vehicleType === 'premium' ? 1200 : 750;
     const basePickup = vehicleType === 'premium' ? 3500 : 2000;
     
     let fare = basePickup + (distanceKm * perKm);
     
     // Wedo 10% competitive discount
     fare = fare * 0.90;
     
     // Round to nearest 50
     const roundedFare = Math.round(fare / 50) * 50;

     return {
        fare: Math.max(roundedFare, vehicleType === 'premium' ? 3000 : 1500),
        commissionRate: 15, // Default 15% profit for the company
     };
  }

  return null;
};
