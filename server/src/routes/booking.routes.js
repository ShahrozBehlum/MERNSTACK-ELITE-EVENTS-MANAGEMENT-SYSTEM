import express from 'express'
import { protect, admin } from '../middleware/auth.middleware.js';
import {bookEvent, sendBookingOTP, getMyBookings, confirmBookings, cancelBooking} from '../controllers/booking.controller.js'

const router = express.Router();

router.route('/').post(protect, bookEvent);
router.route('/send-otp').post(protect, sendBookingOTP);
router.route('/my').get(protect, getMyBookings);
router.route('/:id/confirm').put(protect, admin, confirmBookings);
router.route('/:id').delete(protect, cancelBooking);

export default router;