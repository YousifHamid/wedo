import { Request, Response } from 'express';
import User from '../models/User';
import Transaction, { TransactionType } from '../models/Transaction';
import WalletTopUp, { TopUpStatus } from '../models/WalletTopUp';

// GET /api/wallet/balance - Get driver's wallet balance
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const user = await User.findById(userId).select('walletBalance');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching balance', error });
  }
};

// GET /api/wallet/transactions - Get transaction history
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('trip');

    const total = await Transaction.countDocuments({ user: userId });

    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};

// POST /api/wallet/topup - Driver requests a wallet top-up
export const requestTopUp = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user._id;
    const { amount, reference } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if (!reference) {
      return res.status(400).json({ message: 'Cash deposit reference required' });
    }

    const topUp = await WalletTopUp.create({
      driver: driverId,
      amount,
      reference,
    });

    res.status(201).json(topUp);
  } catch (error) {
    res.status(500).json({ message: 'Error requesting top-up', error });
  }
};

// GET /api/wallet/topups - Get driver's own top-up requests
export const getMyTopUps = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).user._id;
    const topUps = await WalletTopUp.find({ driver: driverId }).sort({ createdAt: -1 });
    res.json(topUps);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching top-ups', error });
  }
};

// POST /api/wallet/topup/:id/approve - Admin approves top-up
export const approveTopUp = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user._id;
    const topUp = await WalletTopUp.findById(req.params.id);

    if (!topUp) return res.status(404).json({ message: 'Top-up request not found' });
    if (topUp.status !== TopUpStatus.PENDING) {
      return res.status(400).json({ message: 'Top-up already processed' });
    }

    // Update top-up status
    topUp.status = TopUpStatus.APPROVED;
    topUp.reviewedBy = adminId;
    topUp.reviewedAt = new Date();
    await topUp.save();

    // Credit driver wallet
    const driver = await User.findById(topUp.driver);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.walletBalance += topUp.amount;
    // If driver was blocked due to zero balance, reactivate
    if (driver.driverStatus === 'blocked' && driver.walletBalance > 0) {
      driver.driverStatus = 'active' as any;
    }
    await driver.save();

    // Log transaction
    await Transaction.create({
      user: topUp.driver,
      amount: topUp.amount,
      type: TransactionType.CREDIT,
      description: `Wallet top-up approved (Ref: ${topUp.reference})`,
      balanceAfter: driver.walletBalance,
    });

    res.json({ message: 'Top-up approved', topUp, newBalance: driver.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Error approving top-up', error });
  }
};

// POST /api/wallet/topup/:id/reject - Admin rejects top-up
export const rejectTopUp = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user._id;
    const topUp = await WalletTopUp.findById(req.params.id);

    if (!topUp) return res.status(404).json({ message: 'Top-up request not found' });
    if (topUp.status !== TopUpStatus.PENDING) {
      return res.status(400).json({ message: 'Top-up already processed' });
    }

    topUp.status = TopUpStatus.REJECTED;
    topUp.reviewedBy = adminId;
    topUp.reviewedAt = new Date();
    topUp.notes = req.body.notes || '';
    await topUp.save();

    res.json({ message: 'Top-up rejected', topUp });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting top-up', error });
  }
};

// GET /api/wallet/topups/pending - Admin gets all pending top-ups
export const getPendingTopUps = async (req: Request, res: Response) => {
  try {
    const topUps = await WalletTopUp.find({ status: TopUpStatus.PENDING })
      .sort({ createdAt: 1 })
      .populate('driver', 'name phone walletBalance');

    res.json(topUps);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending top-ups', error });
  }
};

// Utility: Deduct commission from driver wallet after trip completion
export const deductCommission = async (driverId: string, tripId: string, fare: number, commissionRate: number) => {
  const commission = Math.round(fare * (commissionRate / 100));
  const driver = await User.findById(driverId);
  if (!driver) throw new Error('Driver not found');

  driver.walletBalance -= commission;
  driver.totalEarnings += (fare - commission);
  driver.totalTrips += 1;

  // Block driver if wallet <= 0
  if (driver.walletBalance <= 0) {
    driver.isOnline = false;
    driver.driverStatus = 'blocked' as any;
  }

  await driver.save();

  // Log commission transaction
  await Transaction.create({
    user: driverId,
    amount: commission,
    type: TransactionType.DEBIT,
    description: `Commission deducted (${commissionRate}%)`,
    trip: tripId,
    balanceAfter: driver.walletBalance,
  });

  // Log earnings transaction  
  await Transaction.create({
    user: driverId,
    amount: fare - commission,
    type: TransactionType.CREDIT,
    description: `Trip earnings (fare: ${fare} SDG)`,
    trip: tripId,
    balanceAfter: driver.walletBalance,
  });

  return { commission, newBalance: driver.walletBalance, isBlocked: driver.walletBalance <= 0 };
};
