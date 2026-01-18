import express from 'express'
import {
    bookConsultation,
    getMyConsultations,
    getConsultationById,
    getConsultationByRoomId,
    cancelConsultation,
    startConsultation,
    endConsultation,
    getLawyerSlots
} from '../controllers/consultation.controller.js'

const router = express.Router()

// Booking
router.post('/book', bookConsultation)

// User's consultations
router.get('/my', getMyConsultations)

// Get by room ID (for video call page)
router.get('/room/:roomId', getConsultationByRoomId)

// Single consultation
router.get('/:id', getConsultationById)

// Consultation actions
router.put('/:id/cancel', cancelConsultation)
router.put('/:id/start', startConsultation)
router.put('/:id/end', endConsultation)

// Lawyer availability
router.get('/slots/:lawyerId', getLawyerSlots)

export default router
