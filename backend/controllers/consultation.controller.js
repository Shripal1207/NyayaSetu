import Consultation from '../models/Consultation.model.js'
import User from '../models/User.model.js'
import crypto from 'crypto'

/**
 * Book a consultation
 * POST /api/consultations/book
 */
export const bookConsultation = async (req, res) => {
    try {
        const { lawyerId, scheduledAt, duration, clientNotes } = req.body
        const clientFirebaseId = req.headers['x-user-id'] || req.body.userId

        if (!clientFirebaseId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        // Find client by MongoDB _id
        const client = await User.findById(clientFirebaseId)
        if (!client) {
            return res.status(404).json({ error: 'Client not found' })
        }

        // Find lawyer
        const lawyer = await User.findById(lawyerId)
        if (!lawyer || lawyer.userType !== 'lawyer') {
            return res.status(404).json({ error: 'Lawyer not found' })
        }

        // Check if lawyer is verified
        if (lawyer.verificationStatus !== 'verified') {
            return res.status(400).json({ error: 'Lawyer is not verified' })
        }

        // Parse scheduled date
        const scheduledDate = new Date(scheduledAt)
        if (scheduledDate < new Date()) {
            return res.status(400).json({ error: 'Cannot book consultation in the past' })
        }

        // Check for conflicts (lawyer already booked)
        const endTime = new Date(scheduledDate.getTime() + (duration || 30) * 60000)
        const conflict = await Consultation.findOne({
            lawyerId: lawyer._id,
            status: { $in: ['scheduled', 'ongoing'] },
            $or: [
                {
                    scheduledAt: { $lt: endTime },
                    $expr: {
                        $gt: [
                            { $add: ['$scheduledAt', { $multiply: ['$duration', 60000] }] },
                            scheduledDate
                        ]
                    }
                }
            ]
        })

        if (conflict) {
            return res.status(400).json({
                error: 'This time slot is not available. Please choose another time.'
            })
        }

        // Generate unique room ID
        const roomId = `room_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`

        // Calculate fee
        const hourlyRate = lawyer.consultationFees || 1000
        const fee = Math.round((hourlyRate / 60) * (duration || 30))

        // Create consultation
        const consultation = new Consultation({
            clientId: client._id,
            lawyerId: lawyer._id,
            scheduledAt: scheduledDate,
            duration: duration || 30,
            roomId,
            fee,
            clientNotes
        })

        await consultation.save()

        // Populate for response
        await consultation.populate([
            { path: 'clientId', select: 'name email phone photoURL' },
            { path: 'lawyerId', select: 'name email phone photoURL practiceAreas' }
        ])

        res.status(201).json({
            message: 'Consultation booked successfully',
            consultation: {
                id: consultation._id,
                roomId: consultation.roomId,
                scheduledAt: consultation.scheduledAt,
                duration: consultation.duration,
                fee: consultation.fee,
                status: consultation.status,
                lawyer: consultation.lawyerId,
                client: consultation.clientId
            }
        })

    } catch (error) {
        console.error('Book consultation error:', error)
        res.status(500).json({ error: 'Failed to book consultation' })
    }
}

/**
 * Get user's consultations
 * GET /api/consultations/my
 */
export const getMyConsultations = async (req, res) => {
    try {
        const userFirebaseId = req.headers['x-user-id'] || req.query.userId
        const { status, type = 'all' } = req.query

        if (!userFirebaseId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        const user = await User.findById(userFirebaseId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Build query based on user type
        let query = {}
        if (type === 'client' || (type === 'all' && user.userType !== 'lawyer')) {
            query.clientId = user._id
        } else if (type === 'lawyer' || (type === 'all' && user.userType === 'lawyer')) {
            query.$or = [{ clientId: user._id }, { lawyerId: user._id }]
        }

        if (status) {
            query.status = status
        }

        const consultations = await Consultation.find(query)
            .populate('clientId', 'name email phone photoURL')
            .populate('lawyerId', 'name email phone photoURL practiceAreas yearsOfExperience')
            .sort({ scheduledAt: -1 })

        // Categorize consultations
        const now = new Date()
        const upcoming = consultations.filter(c =>
            ['scheduled'].includes(c.status) && new Date(c.scheduledAt) > now
        )
        const past = consultations.filter(c =>
            ['completed', 'cancelled', 'no-show'].includes(c.status) ||
            (c.status === 'scheduled' && new Date(c.scheduledAt) < now)
        )

        res.status(200).json({
            upcoming,
            past,
            total: consultations.length
        })

    } catch (error) {
        console.error('Get consultations error:', error)
        res.status(500).json({ error: 'Failed to get consultations' })
    }
}

/**
 * Get consultation by ID
 * GET /api/consultations/:id
 */
export const getConsultationById = async (req, res) => {
    try {
        const { id } = req.params
        const userFirebaseId = req.headers['x-user-id'] || req.query.userId

        const consultation = await Consultation.findById(id)
            .populate('clientId', 'name email phone photoURL location')
            .populate('lawyerId', 'name email phone photoURL practiceAreas yearsOfExperience qualification barCouncilNumber')

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' })
        }

        // Verify user is a participant
        const user = await User.findById(userFirebaseId)
        if (user &&
            consultation.clientId._id.toString() !== user._id.toString() &&
            consultation.lawyerId._id.toString() !== user._id.toString() &&
            user.userType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' })
        }

        res.status(200).json(consultation)

    } catch (error) {
        console.error('Get consultation error:', error)
        res.status(500).json({ error: 'Failed to get consultation' })
    }
}

/**
 * Get consultation by room ID
 * GET /api/consultations/room/:roomId
 */
export const getConsultationByRoomId = async (req, res) => {
    try {
        const { roomId } = req.params
        const userFirebaseId = req.headers['x-user-id'] || req.query.userId

        const consultation = await Consultation.findOne({ roomId })
            .populate('clientId', 'name email phone photoURL location')
            .populate('lawyerId', 'name email phone photoURL practiceAreas yearsOfExperience qualification barCouncilNumber')

        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' })
        }

        // Verify user is a participant
        const user = await User.findById(userFirebaseId)
        if (user &&
            consultation.clientId._id.toString() !== user._id.toString() &&
            consultation.lawyerId._id.toString() !== user._id.toString() &&
            user.userType !== 'admin') {
            return res.status(403).json({ error: 'Access denied' })
        }

        res.status(200).json(consultation)

    } catch (error) {
        console.error('Get consultation by room error:', error)
        res.status(500).json({ error: 'Failed to get consultation' })
    }
}

/**
 * Cancel consultation
 * PUT /api/consultations/:id/cancel
 */
export const cancelConsultation = async (req, res) => {
    try {
        const { id } = req.params
        const { reason } = req.body
        const userFirebaseId = req.headers['x-user-id'] || req.body.userId

        const consultation = await Consultation.findById(id)
        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' })
        }

        if (consultation.status !== 'scheduled') {
            return res.status(400).json({ error: 'Only scheduled consultations can be cancelled' })
        }

        const user = await User.findById(userFirebaseId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Verify user is a participant
        if (consultation.clientId.toString() !== user._id.toString() &&
            consultation.lawyerId.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' })
        }

        consultation.status = 'cancelled'
        consultation.cancelledBy = user._id
        consultation.cancellationReason = reason
        consultation.cancelledAt = new Date()

        await consultation.save()

        res.status(200).json({
            message: 'Consultation cancelled successfully',
            consultation
        })

    } catch (error) {
        console.error('Cancel consultation error:', error)
        res.status(500).json({ error: 'Failed to cancel consultation' })
    }
}

/**
 * Start consultation (mark as ongoing)
 * PUT /api/consultations/:id/start
 */
export const startConsultation = async (req, res) => {
    try {
        const { id } = req.params

        const consultation = await Consultation.findById(id)
        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' })
        }

        if (consultation.status !== 'scheduled') {
            return res.status(400).json({ error: 'Consultation cannot be started' })
        }

        consultation.status = 'ongoing'
        consultation.startedAt = new Date()

        await consultation.save()

        res.status(200).json({
            message: 'Consultation started',
            roomId: consultation.roomId
        })

    } catch (error) {
        console.error('Start consultation error:', error)
        res.status(500).json({ error: 'Failed to start consultation' })
    }
}

/**
 * End consultation (mark as completed)
 * PUT /api/consultations/:id/end
 */
export const endConsultation = async (req, res) => {
    try {
        const { id } = req.params
        const { lawyerNotes } = req.body

        const consultation = await Consultation.findById(id)
        if (!consultation) {
            return res.status(404).json({ error: 'Consultation not found' })
        }

        if (consultation.status !== 'ongoing') {
            return res.status(400).json({ error: 'Consultation is not ongoing' })
        }

        consultation.status = 'completed'
        consultation.endedAt = new Date()
        consultation.actualDuration = Math.round(
            (consultation.endedAt - consultation.startedAt) / 1000
        )
        if (lawyerNotes) {
            consultation.lawyerNotes = lawyerNotes
        }

        await consultation.save()

        res.status(200).json({
            message: 'Consultation completed',
            consultation
        })

    } catch (error) {
        console.error('End consultation error:', error)
        res.status(500).json({ error: 'Failed to end consultation' })
    }
}

/**
 * Get lawyer's available slots
 * GET /api/consultations/slots/:lawyerId
 */
export const getLawyerSlots = async (req, res) => {
    try {
        const { lawyerId } = req.params
        const { date } = req.query

        const lawyer = await User.findById(lawyerId)
        if (!lawyer || lawyer.userType !== 'lawyer') {
            return res.status(404).json({ error: 'Lawyer not found' })
        }

        // Get target date
        const targetDate = date ? new Date(date) : new Date()
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

        // Get existing bookings for the day
        const existingBookings = await Consultation.find({
            lawyerId: lawyer._id,
            scheduledAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['scheduled', 'ongoing'] }
        }).select('scheduledAt duration')

        // Generate available slots (9 AM to 6 PM, 30-min intervals)
        const slots = []
        const now = new Date()

        for (let hour = 9; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const slotTime = new Date(startOfDay)
                slotTime.setHours(hour, minute, 0, 0)

                // Skip past slots
                if (slotTime <= now) continue

                // Check if slot conflicts with existing booking
                const isBooked = existingBookings.some(booking => {
                    const bookingStart = new Date(booking.scheduledAt)
                    const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000)
                    const slotEnd = new Date(slotTime.getTime() + 30 * 60000)

                    return slotTime < bookingEnd && slotEnd > bookingStart
                })

                slots.push({
                    time: slotTime,
                    available: !isBooked
                })
            }
        }

        res.status(200).json({
            lawyerId: lawyer._id,
            lawyerName: lawyer.name,
            date: startOfDay,
            slots
        })

    } catch (error) {
        console.error('Get slots error:', error)
        res.status(500).json({ error: 'Failed to get available slots' })
    }
}
