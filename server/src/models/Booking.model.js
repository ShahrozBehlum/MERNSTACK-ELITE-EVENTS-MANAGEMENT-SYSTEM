import mongoose, {Schema} from 'mongoose'

const bookingSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
     eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['non-paid', 'paid'],
        default: 'non-paid'
    },
    amount: {
        type: Number,
        required: true
    },

}, {timestamps: true})

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema)
export default Booking;