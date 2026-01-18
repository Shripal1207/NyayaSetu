import express from 'express'
import { getUserById, getUserByMongoId, getNearbyLawyers, getAllLawyers } from '../controllers/user.controller.js'

const router = express.Router()

router.get('/lawyers/nearby', getNearbyLawyers)
router.get('/lawyers/all', getAllLawyers)
router.get('/by-id/:id', getUserByMongoId)
router.get('/:id', getUserById)

export default router

