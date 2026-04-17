import express from 'express'
import { sendMessage, chatHealth } from '../controllers/chat.controller.js'

const router = express.Router()

router.post('/', sendMessage)
router.get('/health', chatHealth)

export default router
