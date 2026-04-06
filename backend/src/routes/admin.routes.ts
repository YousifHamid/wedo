import express from 'express';
import {
  getDashboardStats, getDrivers, approveDriver, blockDriver,
  updateDriver, getAllTrips, cancelTrip, getComplaints, resolveComplaint,
  getUsers, suspendUser, deleteUser,
  getZones, createZone, updateZone, deleteZone,
  getPricing, updatePricing,
  getTransactions, getWalletTopUps, approveTopUp, rejectTopUp, directTopUp,
  broadcastNotification,
  getStaff, createStaff, updateStaff
} from '../controllers/admin.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = express.Router();
router.use(protect, authorize(UserRole.ADMIN));

// Stats
router.get('/stats', getDashboardStats);

// Drivers
router.get('/drivers', getDrivers);
router.put('/drivers/:id/approve', approveDriver);
router.put('/drivers/:id/block', blockDriver);
router.put('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteUser);

// Users (Riders)
router.get('/users', getUsers);
router.put('/users/:id/suspend', suspendUser);
router.delete('/users/:id', deleteUser);

// Trips
router.get('/trips', getAllTrips);
router.put('/trips/:id/cancel', cancelTrip);

// Complaints
router.get('/complaints', getComplaints);
router.put('/complaints/:id/resolve', resolveComplaint);

// Zones & Pricing
router.get('/zones', getZones);
router.post('/zones', createZone);
router.put('/zones/:id', updateZone);
router.delete('/zones/:id', deleteZone);
router.get('/pricing', getPricing);
router.put('/pricing/:id', updatePricing);

// Wallet
router.get('/wallet/topups', getWalletTopUps);
router.put('/wallet/topups/:id/approve', approveTopUp);
router.put('/wallet/topups/:id/reject', rejectTopUp);
router.get('/transactions', getTransactions);
router.post('/wallet/direct-topup', directTopUp);

// Notifications
// Staff & Roles (Super Admin ONLY)
router.get('/staff', authorize(UserRole.SUPER_ADMIN), getStaff);
router.post('/staff', authorize(UserRole.SUPER_ADMIN), createStaff);
router.put('/staff/:id', authorize(UserRole.SUPER_ADMIN), updateStaff);
router.delete('/staff/:id', authorize(UserRole.SUPER_ADMIN), deleteUser);

export default router;
