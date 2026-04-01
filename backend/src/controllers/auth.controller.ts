import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone, and password are required' });
    }

    // Check if user exists by phone
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'User with this phone already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'rider',
    });

    if (user) {
      const token = generateToken(user._id.toString(), user.role);
      res.status(201).json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletBalance: user.walletBalance,
          driverStatus: user.driverStatus,
          totalTrips: user.totalTrips,
          totalEarnings: user.totalEarnings,
          vehicleDetails: user.vehicleDetails,
          isOnline: user.isOnline,
        },
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { phone, password, role } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }

    // Find by phone, optionally filter by role
    const query: any = { phone };
    if (role) query.role = role;

    const user = await User.findOne(query);

    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user._id.toString(), user.role);
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletBalance: user.walletBalance,
          currentZone: user.currentZone,
          driverStatus: user.driverStatus,
          reliabilityScore: user.reliabilityScore,
          totalTrips: user.totalTrips,
          totalEarnings: user.totalEarnings,
          vehicleDetails: user.vehicleDetails,
          isOnline: user.isOnline,
        },
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid phone number or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user._id);
  if (user) {
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        currentZone: user.currentZone,
        driverStatus: user.driverStatus,
        reliabilityScore: user.reliabilityScore,
        totalTrips: user.totalTrips,
        totalEarnings: user.totalEarnings,
        vehicleDetails: user.vehicleDetails,
        isOnline: user.isOnline,
      },
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
