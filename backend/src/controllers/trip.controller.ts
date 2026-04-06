import { Request, Response } from 'express';
import Trip, { TripStatus } from '../models/Trip';
import User, { UserRole } from '../models/User';
import Complaint from '../models/Complaint';
import Pricing from '../models/Pricing';
import mongoose from 'mongoose';
import { startDispatch, recordDispatchAttempt, getFareEstimate } from '../services/matching.service';
import { deductCommission } from './wallet.controller';

// POST /api/trip/request - Rider requests a trip (zone-based)
export const requestTrip = async (req: Request, res: Response) => {
  try {
    const { pickupZoneId, dropoffZoneId, vehicleType } = req.body;
    const riderId = (req as any).user._id;

    if (!pickupZoneId || !dropoffZoneId) {
      return res.status(400).json({ message: 'Pickup and drop-off zones are required' });
    }

    // Get fare estimate
    const fareData = await getFareEstimate(pickupZoneId, dropoffZoneId, vehicleType || 'standard');
    if (!fareData) {
      return res.status(404).json({ message: 'No pricing found for this route' });
    }

    // Create trip
    const newTrip = await Trip.create({
      rider: riderId,
      pickupZone: pickupZoneId,
      dropoffZone: dropoffZoneId,
      vehicleType: vehicleType || 'standard',
      fareEstimate: fareData.fare,
      commissionRate: fareData.commissionRate,
      paymentMethod: 'cash',
      status: TripStatus.PENDING,
    });

    // Start sequential dispatch
    const matchedDriver = await startDispatch(newTrip._id.toString());

    if (!matchedDriver) {
      return res.status(200).json({
        trip: newTrip,
        message: 'No drivers available in your zone. Please try again.',
        driverAssigned: false,
      });
    }

    const updatedTrip = await Trip.findById(newTrip._id)
      .populate('pickupZone dropoffZone');

    res.status(201).json({
      trip: updatedTrip,
      dispatchedTo: matchedDriver,
      driverAssigned: false, // Still dispatching, waiting for acceptance
      message: 'Finding you a driver...',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting trip', error });
  }
};

// POST /api/trip/:tripId/accept - Driver accepts trip
export const acceptTrip = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const driverId = (req as any).user._id;

    // Check driver wallet balance
    const driver = await User.findById(driverId);
    if (!driver || driver.walletBalance <= 0) {
      return res.status(403).json({ message: 'Insufficient wallet balance to accept trips' });
    }

    // Mark driver as busy
    driver.isBusy = true;
    await driver.save();

    const trip = await recordDispatchAttempt(tripId, driverId, 'accepted');

    const populatedTrip = await Trip.findById(tripId)
      .populate('rider', 'name phone')
      .populate('pickupZone dropoffZone');

    res.json({ message: 'Trip accepted', trip: populatedTrip });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting trip', error });
  }
};

// POST /api/trip/:tripId/reject - Driver rejects trip, dispatch to next
export const rejectTrip = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const driverId = (req as any).user._id;

    await recordDispatchAttempt(tripId, driverId, 'rejected');

    // Try next driver
    const nextDriver = await startDispatch(tripId);

    if (!nextDriver) {
      return res.json({ message: 'Trip rejected. No more drivers available.', nextDriver: null });
    }

    res.json({ message: 'Trip rejected, dispatching to next driver', nextDriver });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting trip', error });
  }
};

// PUT /api/trip/:tripId/status - Update trip status
export const updateTripStatus = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;
    const driverId = (req as any).user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.driver?.toString() !== driverId.toString() && (req as any).user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Status transitions validation
    const validTransitions: Record<string, string[]> = {
      [TripStatus.ACCEPTED]: [TripStatus.ARRIVED],
      [TripStatus.ARRIVED]: [TripStatus.ACTIVE],
      [TripStatus.ACTIVE]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
    };

    if (validTransitions[trip.status] && !validTransitions[trip.status].includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${trip.status} to ${status}` });
    }

    trip.status = status;

    // If completing trip, deduct commission from driver wallet
    if (status === TripStatus.COMPLETED && trip.driver) {
      const finalFare = trip.fareEstimate; // In zone-based, fare is fixed
      trip.finalFare = finalFare;

      const commResult = await deductCommission(
        trip.driver.toString(),
        tripId,
        finalFare,
        trip.commissionRate || 15
      );

      trip.commission = commResult.commission;

      // Mark driver as available again
      await User.findByIdAndUpdate(trip.driver, { isBusy: false });
    }

    if (status === TripStatus.CANCELLED && trip.driver) {
       await User.findByIdAndUpdate(trip.driver, { isBusy: false });
    }

    await trip.save();

    const populatedTrip = await Trip.findById(tripId)
      .populate('rider', 'name phone')
      .populate('driver', 'name phone vehicleDetails')
      .populate('pickupZone dropoffZone');

    res.json({ message: `Trip status updated to ${status}`, trip: populatedTrip });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error });
  }
};

// POST /api/trip/:tripId/rate - Rate a completed trip
export const rateTrip = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { rating, comment } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.status !== TripStatus.COMPLETED) {
      return res.status(400).json({ message: 'Can only rate completed trips' });
    }

    trip.rating = rating;
    trip.ratingComment = comment;
    await trip.save();

    // Update driver reliability score based on rating
    if (trip.driver && rating) {
      const scoreAdjust = rating >= 4 ? 1 : rating <= 2 ? -3 : 0;
      await User.findByIdAndUpdate(trip.driver, {
        $inc: { reliabilityScore: scoreAdjust }
      });
    }

    res.json({ message: 'Trip rated', trip });
  } catch (error) {
    res.status(500).json({ message: 'Error rating trip', error });
  }
};

// GET /api/trip/history - Get trip history for current user
export const getTripHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const role = (req as any).user.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const query = role === 'rider' ? { rider: userId } : { driver: userId };

    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('rider', 'name phone')
      .populate('driver', 'name phone vehicleDetails')
      .populate('pickupZone dropoffZone');

    const total = await Trip.countDocuments(query);

    res.json({ trips, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trip history', error });
  }
};

// --- Add Complaint ---
export const submitComplaint = async (req: Request, res: Response) => {
  try {
    const { tripId } = req.params;
    const { reason, details, reportedId } = req.body;
    const userId = (req as any).user._id;

    const complaint = new Complaint({
      tripId,
      reporterId: userId,
      reportedId,
      reason,
      details
    });

    await complaint.save();
    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint', error });
  }
};
