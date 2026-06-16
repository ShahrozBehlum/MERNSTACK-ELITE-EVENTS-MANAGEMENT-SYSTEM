import Booking from "../models/Booking.model.js";
import OTP from "../models/OTP.model.js";
import Event from "../models/Event.model.js";
import { sendBookingEmail, sendOTPEmail } from "../utils/email.js";

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' })
        await OTP.create({ email: req.user.email, otp: otp, action: 'event_booking' })
        await sendOTPEmail(req.user.email, otp, 'event_booking')
        res.json({ message: 'OTP sent to email' })

    } catch (error) {
        res.status(500).json({ message: 'Failed to sent OTP', error: error.message })
    }
};

export const bookEvent = async (req, res) => {
    const { eventId, otp } = req.body;

    try {
        if (!otp) {
            return res.status(400).json({ message: 'OTP Required' });
        }

        const otpRecord = await OTP.findOne({
            email: req.user.email,
            otp,
            action: 'event_booking'
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(400).json({ message: 'Event not found' });
        }

        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available' });
        }

        const bookingExist = await Booking.findOne({
            userId: req.user._id,
            eventId
        });

        if (bookingExist) {
            return res.status(400).json({ message: 'You already booked this event' });
        }

        const booking = new Booking({
            userId: req.user._id,
            eventId,
            status: 'pending',
            paymentStatus: 'non-paid',
            amount: event.ticketPrice
        });

        await booking.save();

        console.log("COLLECTION:", Booking.collection.name);
        console.log("BOOKING SAVED:", booking);

        await OTP.deleteMany({
            email: req.user.email,
            action: 'event_booking'
        });

        await sendBookingEmail(req.user.email, event.title, booking._id);

        return res.status(201).json({
            message: 'Booking created successfully',
            booking
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to book event',
            error: error.message
        });
    }
};

export const confirmBookings = async (req, res) => {
    try {
        const { paymentStatus } = req.body; // 'paid' or 'not_paid'
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') return res.status(400).json({ message: 'Booking is already confirmed' });

        const event = await Event.findById(booking.eventId._id);
        if (event.availableSeats <= 0) {
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        booking.status = 'confirmed';
        booking.paymentStatus = paymentStatus;

        await booking.save();

        await Event.findByIdAndUpdate(event._id, {
            $inc: { availableSeats: -1 }
        });

        // Send email on admin confirmation
        if (booking?.userId?.email && booking?.eventId?.title) {
            try {
                await sendBookingEmail(
                    booking.userId.email,
                    booking.userId.name,
                    booking.eventId.title
                );
            } catch (err) {
                console.error("Email error:", err.message);
            }
        }

        res.json({ message: 'Booking confirmed successfully', booking });
    } catch (error) {
        console.error("CONFIRM BOOKING ERROR FULL:", error);
        res.status(500).json({
            message: 'Server Error',
            error: error.message,
            stack: error.stack
        });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user._id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';

        booking.status = 'cancelled';
        await booking.save();

        // Only restore the seat if it was actually confirmed and deducted
        if (wasConfirmed) {
            const event = await Event.findById(booking.eventId);
            if (event) {
                event.availableSeats += 1;
                await event.save();
            }
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};