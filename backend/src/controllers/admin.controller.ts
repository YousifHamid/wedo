import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import Trip, { TripStatus } from '../models/Trip';
import WalletTopUp from '../models/WalletTopUp';
import Transaction, { TransactionType } from '../models/Transaction';
import Complaint from '../models/Complaint';
import Zone from '../models/Zone';
import Pricing from '../models/Pricing';
import { TopUpStatus } from '../models/WalletTopUp';

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

// GET /api/admin/complaints - Get all complaints
export const getComplaints = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('tripId', 'status finalFare dropoffAddress')
      .populate('reporterId', 'name phone role')
      .populate('reportedId', 'name phone role');

    const total = await Complaint.countDocuments();
    res.json({ complaints, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints', error });
  }
};
// PUT /api/admin/drivers/:id - Update driver details
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const driver = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json({ message: 'Driver updated', driver });
  } catch (error) {
    res.status(500).json({ message: 'Error updating driver', error });
  }
};

// PUT /api/admin/trips/:id/cancel - Cancel a trip
export const cancelTrip = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.id, { status: TripStatus.CANCELLED }, { new: true });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip cancelled', trip });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling trip', error });
  }
};

// PUT /api/admin/complaints/:id/resolve - Resolve a complaint
export const resolveComplaint = async (req: Request, res: Response) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ message: 'Complaint resolved', complaint });
  } catch (error) {
    res.status(500).json({ message: 'Error resolving complaint', error });
  }
};

// GET /api/admin/users - Get all users (riders)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: UserRole.RIDER }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

// PUT /api/admin/users/:id/suspend - Suspend/Unsuspend user
export const suspendUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: user.isBlocked ? 'User suspended' : 'User unsuspended', user });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling user suspension', error });
  }
};

// DELETE /api/admin/users/:id - Delete a user or driver
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};

// GET /api/admin/zones - Get all zones
export const getZones = async (req: Request, res: Response) => {
  try {
    const zones = await Zone.find().sort({ order: 1 });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching zones', error });
  }
};

// POST /api/admin/zones - Create a new zone
export const createZone = async (req: Request, res: Response) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ message: 'Error creating zone', error });
  }
};

// PUT /api/admin/zones/:id - Update zone
export const updateZone = async (req: Request, res: Response) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ message: 'Error updating zone', error });
  }
};

// DELETE /api/admin/zones/:id - Delete zone
export const deleteZone = async (req: Request, res: Response) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    res.json({ message: 'Zone deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting zone', error });
  }
};

// GET /api/admin/pricing - Get pricing table
export const getPricing = async (req: Request, res: Response) => {
  try {
    const pricing = await Pricing.find().populate('fromZone toZone');
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pricing', error });
  }
};

// PUT /api/admin/pricing/:id - Update pricing
export const updatePricing = async (req: Request, res: Response) => {
  try {
    const pricing = await Pricing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pricing) return res.status(404).json({ message: 'Pricing entry not found' });
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: 'Error updating pricing', error });
  }
};

// GET /api/admin/wallet/topups - Get all top-up requests
export const getWalletTopUps = async (req: Request, res: Response) => {
  try {
    const topups = await WalletTopUp.find().sort({ createdAt: -1 }).populate('driver', 'name phone role');
    res.json(topups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching topups', error });
  }
};

// PUT /api/admin/wallet/topups/:id/approve - Approve top-up
export const approveTopUp = async (req: Request, res: Response) => {
  try {
    const topup = await WalletTopUp.findById(req.params.id);
    if (!topup || topup.status !== TopUpStatus.PENDING) return res.status(400).json({ message: 'Invalid topup request' });

    topup.status = TopUpStatus.APPROVED;
    await topup.save();

    const user = await User.findById(topup.driver);
    if (user) {
      user.walletBalance += topup.amount;
      await user.save();

      await Transaction.create({
        user: user._id,
        amount: topup.amount,
        type: TransactionType.CREDIT,
        description: 'Wallet top-up approved by admin',
        balanceAfter: user.walletBalance
      });
    }

    res.json({ message: 'Topup approved', topup });
  } catch (error) {
    res.status(500).json({ message: 'Error approving topup', error });
  }
};

// PUT /api/admin/wallet/topups/:id/reject - Reject top-up
export const rejectTopUp = async (req: Request, res: Response) => {
  try {
    const topup = await WalletTopUp.findByIdAndUpdate(req.params.id, { status: TopUpStatus.REJECTED }, { new: true });
    res.json({ message: 'Topup rejected', topup });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting topup', error });
  }
};

// GET /api/admin/transactions - Get all transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 }).populate('user', 'name phone role');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};

// POST /api/admin/notifications/broadcast - Placeholder for push notifications
export const broadcastNotification = async (req: Request, res: Response) => {
  try {
    const { title, message, target } = req.body;
    // logic here for firebase/expo notifications
    res.json({ message: 'Broadcast initiated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error broadcasting notification', error });
  }
};

// POST /api/admin/wallet/direct-topup - Direct credit to driver(s)
export const directTopUp = async (req: Request, res: Response) => {
  try {
    const { phone, driverIds, amount, description, type } = req.body;
    const isDeduction = type === 'debit';
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount required' });
    }

    let driversToUpdate = [];

    if (phone) {
      const driver = await User.findOne({ phone, role: UserRole.DRIVER });
      if (!driver) return res.status(404).json({ message: 'Driver not found' });
      driversToUpdate = [driver];
    } else if (driverIds && Array.isArray(driverIds)) {
      driversToUpdate = await User.find({ _id: { $in: driverIds }, role: UserRole.DRIVER });
    } else if (req.body.allDrivers) {
      driversToUpdate = await User.find({ role: UserRole.DRIVER });
    }

    if (driversToUpdate.length === 0) {
      return res.status(404).json({ message: 'No drivers found to update' });
    }

    const count = driversToUpdate.length;
    for (const driver of driversToUpdate) {
      driver.walletBalance += isDeduction ? -amount : amount;
      await driver.save();

      await Transaction.create({
        user: driver._id,
        amount: amount,
        type: isDeduction ? TransactionType.DEBIT : TransactionType.CREDIT,
        description: description || `Admin direct ${isDeduction ? 'deduction' : 'top-up'}`,
        balanceAfter: driver.walletBalance
      });
    }

    res.json({ 
      message: `Successfully updated ${count} drivers`,
      count 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error performing direct top-up', error });
  }
};

// GET /api/admin/staff - Get all administrative staff (Super Admin only)
export const getStaff = async (req: Request, res: Response) => {
  try {
    const staff = await User.find({ role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff', error });
  }
};

// POST /api/admin/staff - Create new staff member
export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, phone, password, role, permissions } = req.body;
    
    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Phone already registered' });

    const staff = await User.create({
      name,
      phone,
      password,
      role: role || UserRole.ADMIN,
      permissions: permissions || []
    });

    res.status(201).json({ message: 'Staff member created', staff });
  } catch (error) {
    res.status(500).json({ message: 'Error creating staff', error });
  }
};

// PUT /api/admin/staff/:id - Update staff permissions/details
export const updateStaff = async (req: Request, res: Response) => {
  try {
    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    ).select('-password');
    
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });
    res.json({ message: 'Staff member updated', staff });
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff', error });
  }
};
