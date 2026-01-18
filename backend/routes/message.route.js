import express from 'express'
import {
    getConversations,
    getMessages,
    sendMessage,
    startConversation
} from '../controllers/message.controller.js'

const router = express.Router()

// Get all conversations for the authenticated user
router.get('/conversations', getConversations)

// Get messages for a specific conversation
router.get('/:conversationId', getMessages)

// Send a message
router.post('/send', sendMessage)

// Start or get a conversation with another user
router.post('/start-conversation', startConversation)

export default router
