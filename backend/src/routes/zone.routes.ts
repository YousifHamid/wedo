import express from 'express';
import { getZones, getZonePricing, getAllPricing, createZone, updateZone, setPricing } from '../controllers/zone.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = express.Router();

// Public routes (zones are cached on client)
router.get('/', getZones);
router.get('/pricing', getZonePricing);

// Admin routes
router.get('/pricing/all', protect, authorize(UserRole.ADMIN), getAllPricing);
router.post('/', protect, authorize(UserRole.ADMIN), createZone);
router.put('/:id', protect, authorize(UserRole.ADMIN), updateZone);
router.post('/pricing', protect, authorize(UserRole.ADMIN), setPricing);

export default router;
