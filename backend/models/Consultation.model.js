import mongoose from 'mongoose'

const consultationSchema = new mongoose.Schema({
    // Participants
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lawyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Scheduling
    scheduledAt: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 30,
        enum: [15, 30, 45, 60]
    },

    // Status
    status: {
        type: String,
        enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },

    // Video call room
    roomId: {
        type: String,
        unique: true,
        required: true
    },

    // Call details
    startedAt: Date,
    endedAt: Date,
    actualDuration: Number, // in seconds

    // Notes and summary
    clientNotes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    lawyerNotes: {
        type: String,
        trim: true,
        maxlength: 2000
    },

    // Payment
    fee: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentId: String,

    // Ratings
    clientRating: {
        type: Number,
        min: 1,
        max: 5
    },
    clientReview: {
        type: String,
        trim: true,
        maxlength: 500
    },

    // Cancellation
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: String,
    cancelledAt: Date

}, {
    timestamps: true
})

// Generate unique room ID
consultationSchema.pre('save', function (next) {
    if (!this.roomId) {
        this.roomId = `room_${this._id}_${Date.now()}`
    }
    next()
})

// Index for finding upcoming consultations
consultationSchema.index({ clientId: 1, scheduledAt: 1 })
consultationSchema.index({ lawyerId: 1, scheduledAt: 1 })
consultationSchema.index({ status: 1, scheduledAt: 1 })

const Consultation = mongoose.model('Consultation', consultationSchema)

export default Consultation
