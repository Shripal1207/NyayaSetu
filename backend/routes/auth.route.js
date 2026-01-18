import express from 'express'
import { signup, login, getCurrentUser, updateProfile, verifyToken } from '../controllers/auth.controller.js'

const router = express.Router()

// Public routes
router.post('/signup', signup)
router.post('/login', login)

// Protected routes
router.get('/me', getCurrentUser)
router.put('/profile', verifyToken, updateProfile)

export default router
