import express from 'express';
import {
  getWalletBalance,
  getTransactions,
  requestTopUp,
  getMyTopUps,
  approveTopUp,
  rejectTopUp,
  getPendingTopUps,
} from '../controllers/wallet.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Driver routes
router.get('/balance', protect, getWalletBalance);
router.get('/transactions', protect, getTransactions);
router.post('/topup', protect, authorize(UserRole.DRIVER), requestTopUp);
router.get('/topups', protect, authorize(UserRole.DRIVER), getMyTopUps);

// Admin routes
router.get('/topups/pending', protect, authorize(UserRole.ADMIN), getPendingTopUps);
router.post('/topup/:id/approve', protect, authorize(UserRole.ADMIN), approveTopUp);
router.post('/topup/:id/reject', protect, authorize(UserRole.ADMIN), rejectTopUp);

export default router;
