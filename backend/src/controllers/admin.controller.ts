import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import Trip, { TripStatus } from '../models/Trip';
import WalletTopUp from '../models/WalletTopUp';
import Transaction from '../models/Transaction';

// GET /api/admin/stats - Dashboard overview
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalDrivers,
      onlineDrivers,
      pendingDrivers,
      blockedDrivers,
      tripsToday,
      activeTrips,
      totalTrips,
      pendingTopUps,
    ] = await Promise.all([
      User.countDocuments({ role: UserRole.DRIVER }),
      User.countDocuments({ role: UserRole.DRIVER, isOnline: true }),
      User.countDocuments({ role: UserRole.DRIVER, driverStatus: 'pending' }),
      User.countDocuments({ role: UserRole.DRIVER, driverStatus: 'blocked' }),
      Trip.countDocuments({ createdAt: { $gte: today } }),
      Trip.countDocuments({ status: { $in: [TripStatus.ACCEPTED, TripStatus.ARRIVED, TripStatus.ACTIVE] } }),
      Trip.countDocuments(),
      WalletTopUp.countDocuments({ status: 'pending' }),
    ]);

    // Today's commissions
    const todayCommissions = await Trip.aggregate([
      { $match: { status: TripStatus.COMPLETED, updatedAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$commission' } } }
    ]);

    res.json({
      totalDrivers,
      onlineDrivers,
      pendingDrivers,
      blockedDrivers,
      tripsToday,
      activeTrips,
      totalTrips,
      pendingTopUps,
      todayCommissions: todayCommissions[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error });
  }
};

// GET /api/admin/drivers - List all drivers
export const getDrivers = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = { role: UserRole.DRIVER };
    if (status) query.driverStatus = status;

    const drivers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drivers', error });
  }
};

// PUT /api/admin/drivers/:id/approve - Approve a pending driver
export const approveDriver = async (req: Request, res: Response) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { driverStatus: 'active', isVerified: true },
      { new: true }
    ).select('-password');

    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json({ message: 'Driver approved', driver });
  } catch (error) {
    res.status(500).json({ message: 'Error approving driver', error });
  }
};

// PUT /api/admin/drivers/:id/block - Block a driver
export const blockDriver = async (req: Request, res: Response) => {
  try {
    const driver = await User.findByIdAndUpdate(
      req.params.id,
      { driverStatus: 'blocked', isOnline: false },
      { new: true }
    ).select('-password');

    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json({ message: 'Driver blocked', driver });
  } catch (error) {
    res.status(500).json({ message: 'Error blocking driver', error });
  }
};

// GET /api/admin/trips - Get all trips with filters
export const getAllTrips = async (req: Request, res: Response) => {
  try {
    const { status, page: pageStr, limit: limitStr } = req.query;
    const page = parseInt(pageStr as string) || 1;
    const limit = parseInt(limitStr as string) || 50;
    const query: any = {};
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('rider', 'name phone')
      .populate('driver', 'name phone')
      .populate('pickupZone dropoffZone');

    const total = await Trip.countDocuments(query);
    res.json({ trips, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching trips', error });
  }
};
