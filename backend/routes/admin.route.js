import express from 'express'
import { isAdmin } from '../middleware/admin.middleware.js'
import {
    getStats,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getLawyers,
    getPendingVerifications,
    toggleVerified
} from '../controllers/admin.controller.js'

const router = express.Router()

// All admin routes require admin privileges
router.use(isAdmin)

// Dashboard
router.get('/stats', getStats)

// User management
router.get('/users', getUsers)
router.get('/users/:id', getUserById)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.put('/users/:id/toggle-verified', toggleVerified)

// Lawyer management
router.get('/lawyers', getLawyers)

// Verifications
router.get('/verifications', getPendingVerifications)

export default router
