import express from 'express';
import { getDashboardStats, getDrivers, approveDriver, blockDriver, getAllTrips } from '../controllers/admin.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(protect, authorize(UserRole.ADMIN));

router.get('/stats', getDashboardStats);
router.get('/drivers', getDrivers);
router.put('/drivers/:id/approve', approveDriver);
router.put('/drivers/:id/block', blockDriver);
router.get('/trips', getAllTrips);

export default router;
