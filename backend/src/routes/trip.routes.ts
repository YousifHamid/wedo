import express from 'express';
import { requestTrip, acceptTrip, rejectTrip, updateTripStatus, rateTrip, getTripHistory, submitComplaint } from '../controllers/trip.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = express.Router();

router.post('/request', protect, authorize(UserRole.RIDER, UserRole.DRIVER), requestTrip);
router.post('/:tripId/accept', protect, authorize(UserRole.DRIVER), acceptTrip);
router.post('/:tripId/reject', protect, authorize(UserRole.DRIVER), rejectTrip);
router.put('/:tripId/status', protect, authorize(UserRole.DRIVER, UserRole.ADMIN), updateTripStatus);
router.post('/:tripId/rate', protect, rateTrip);
router.get('/history', protect, getTripHistory);
router.post('/:tripId/complaint', protect, submitComplaint);

export default router;
