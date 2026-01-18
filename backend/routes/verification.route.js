import express from 'express'
import {
    submitVerification,
    getVerificationStatus,
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    getStateBarCouncils
} from '../controllers/verification.controller.js'

const router = express.Router()

// Public routes
router.get('/states', getStateBarCouncils)
router.get('/status/:userId', getVerificationStatus)

// Protected routes (requires authentication)
router.post('/submit', submitVerification)

// Admin routes
router.get('/pending', getPendingVerifications)
router.put('/:id/approve', approveVerification)
router.put('/:id/reject', rejectVerification)

export default router
