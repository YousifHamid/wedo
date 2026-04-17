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

// Utility: Deduct commission from driver wallet after trip completion, applying 9% and loyalty rules
export const deductCommission = async (driverId: string, riderId: string, tripId: string, fare: number, overrideCommission: number = 9) => {
  const driver = await User.findById(driverId);
  const rider = await User.findById(riderId);
  if (!driver) throw new Error('Driver not found');

  let finalCommissionRate = overrideCommission; // Ensure base is 9%
  let description = `Commission deducted (${finalCommissionRate}%)`;
  let isFreeForRider = false;

  // --- RIDER LOYALTY --- 
  // Give Rider 5% of the fare as Points!
  const earnedPoints = Math.round(fare * 0.05);

  if (rider) {
    if (rider.loyaltyStreak >= 3) {
      // 4th trip is Free via Streak!
      isFreeForRider = true;
      rider.loyaltyStreak = 0;
      rider.loyaltyPoints += earnedPoints;
      description = `Commission deducted (${finalCommissionRate}%) - Rider Free via Streak`;
    } else if (rider.loyaltyPoints >= fare) {
      // Free trip by redeeming accumulated loyalty points!
      isFreeForRider = true;
      rider.loyaltyPoints -= fare;
      rider.loyaltyStreak += 1;
      description = `Commission deducted (${finalCommissionRate}%) - Rider Free via Points`;
    } else {
      // Normal cash trip, rider earns points
      rider.loyaltyStreak += 1;
      rider.loyaltyPoints += earnedPoints;
    }
    rider.totalTrips += 1;
    await rider.save();
  }

  // --- DRIVER LOYALTY ---
  // Zero commission on 11th trip
  if (driver.loyaltyStreak >= 10) {
    finalCommissionRate = 0;
    description = `Loyalty Reward: 0% Commission (11th Consecutive Trip)`;
    driver.loyaltyStreak = 0;
  } else {
    driver.loyaltyStreak += 1;
  }

  const commission = Math.round(fare * (finalCommissionRate / 100));
  const driverEarnings = fare - commission;

  if (isFreeForRider) {
    // Rider paid nothing! The system subsidizes the trip by directly adding driver's earnings to their wallet
    driver.walletBalance += driverEarnings;
    driver.totalEarnings += driverEarnings;
    
    await Transaction.create({
      user: driverId,
      amount: driverEarnings,
      type: TransactionType.CREDIT,
      description: `Rider Free Trip Subsidization (System compensated)`,
      trip: tripId,
      balanceAfter: driver.walletBalance,
    });
  } else {
    // Normal cash trip! Driver collected full cash, so we deduct the app's commission component.
    driver.walletBalance -= commission;
    driver.totalEarnings += driverEarnings;
    
    if (commission > 0) {
      await Transaction.create({
        user: driverId,
        amount: commission,
        type: TransactionType.DEBIT,
        description: description,
        trip: tripId,
        balanceAfter: driver.walletBalance,
      });
    } else {
       await Transaction.create({
        user: driverId,
        amount: 0,
        type: TransactionType.CREDIT,
        description: description,
        trip: tripId,
        balanceAfter: driver.walletBalance,
      });
    }
  }

  driver.totalTrips += 1;

  // Block driver only if wallet balance becomes strictly negative
  if (driver.walletBalance < 0) {
    driver.isOnline = false;
    driver.driverStatus = 'blocked' as any;
  }

  await driver.save();

  return { commission, newBalance: driver.walletBalance, isBlocked: driver.walletBalance < 0, isFreeForRider };
};
