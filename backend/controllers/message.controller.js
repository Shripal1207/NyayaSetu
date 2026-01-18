import Message from '../models/Message.model.js'
import Conversation from '../models/Conversation.model.js'
import User from '../models/User.model.js'

/**
 * Get all conversations for a user
 * GET /api/messages/conversations
 */
export const getConversations = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        // Find user by MongoDB _id
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Find all conversations where user is a participant
        const conversations = await Conversation.find({
            participants: user._id
        })
            .populate('participants', 'name email photoURL userType')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 })

        // Format conversations with otherUser info
        const formattedConversations = conversations.map(conv => {
            const otherUser = conv.participants.find(
                p => p._id.toString() !== user._id.toString()
            )
            return {
                _id: conv._id,
                otherUser,
                lastMessage: conv.lastMessage,
                lastMessageAt: conv.lastMessageAt,
                unreadCount: conv.unreadCount?.get(user._id.toString()) || 0
            }
        })

        res.status(200).json({ conversations: formattedConversations })
    } catch (error) {
        console.error('Get conversations error:', error)
        res.status(500).json({ error: 'Failed to get conversations' })
    }
}

/**
 * Get messages for a conversation
 * GET /api/messages/:conversationId
 */
export const getMessages = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const { conversationId } = req.params

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: user._id
        })

        if (!conversation) {
            return res.status(403).json({ error: 'Access denied' })
        }

        // Get messages
        const messages = await Message.find({ conversationId })
            .populate('senderId', 'name photoURL')
            .sort({ createdAt: 1 })
            .limit(100)

        // Mark messages as read
        await Message.updateMany(
            { conversationId, receiverId: user._id, read: false },
            { read: true, readAt: new Date() }
        )

        // Reset unread count for this user
        conversation.unreadCount.set(user._id.toString(), 0)
        await conversation.save()

        res.status(200).json({ messages })
    } catch (error) {
        console.error('Get messages error:', error)
        res.status(500).json({ error: 'Failed to get messages' })
    }
}

/**
 * Send a message
 * POST /api/messages/send
 */
export const sendMessage = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const { conversationId, receiverId, content, messageType = 'text' } = req.body

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        if (!content?.trim()) {
            return res.status(400).json({ error: 'Message content is required' })
        }

        const sender = await User.findById(userId)
        if (!sender) {
            return res.status(404).json({ error: 'Sender not found' })
        }

        let conversation
        let receiver

        // If conversationId provided, use existing conversation
        if (conversationId) {
            conversation = await Conversation.findById(conversationId)
            if (!conversation) {
                return res.status(404).json({ error: 'Conversation not found' })
            }

            // Get the other participant as receiver
            const receiverObjectId = conversation.participants.find(
                p => p.toString() !== sender._id.toString()
            )
            receiver = await User.findById(receiverObjectId)
        } else if (receiverId) {
            // Create new conversation or find existing - receiverId is now MongoDB _id
            receiver = await User.findById(receiverId)
            if (!receiver) {
                return res.status(404).json({ error: 'Receiver not found' })
            }

            // Check if conversation already exists
            conversation = await Conversation.findOne({
                participants: { $all: [sender._id, receiver._id] }
            })

            // Create new conversation if doesn't exist
            if (!conversation) {
                conversation = new Conversation({
                    participants: [sender._id, receiver._id],
                    unreadCount: new Map()
                })
                await conversation.save()
            }
        } else {
            return res.status(400).json({ error: 'conversationId or receiverId is required' })
        }

        // Create message
        const message = new Message({
            conversationId: conversation._id,
            senderId: sender._id,
            receiverId: receiver._id,
            content: content.trim(),
            messageType
        })
        await message.save()

        // Update conversation
        conversation.lastMessage = message._id
        conversation.lastMessageAt = new Date()

        // Increment unread count for receiver
        const currentUnread = conversation.unreadCount.get(receiver._id.toString()) || 0
        conversation.unreadCount.set(receiver._id.toString(), currentUnread + 1)

        await conversation.save()

        // Populate sender info for response
        await message.populate('senderId', 'name photoURL')

        res.status(201).json({
            message: {
                _id: message._id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                messageType: message.messageType,
                createdAt: message.createdAt
            },
            conversationId: conversation._id
        })
    } catch (error) {
        console.error('Send message error:', error)
        res.status(500).json({ error: 'Failed to send message' })
    }
}

/**
 * Start or get a conversation with a user
 * POST /api/messages/start-conversation
 */
export const startConversation = async (req, res) => {
    try {
        const userId = req.headers['x-user-id']
        const { otherUserId } = req.body

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        if (!otherUserId) {
            return res.status(400).json({ error: 'otherUserId is required' })
        }

        const user = await User.findById(userId)
        const otherUser = await User.findById(otherUserId)

        if (!user || !otherUser) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [user._id, otherUser._id] }
        }).populate('participants', 'name email photoURL userType')

        if (!conversation) {
            // Create new conversation
            conversation = new Conversation({
                participants: [user._id, otherUser._id],
                unreadCount: new Map()
            })
            await conversation.save()
            await conversation.populate('participants', 'name email photoURL userType')
        }

        const otherParticipant = conversation.participants.find(
            p => p._id.toString() !== user._id.toString()
        )

        res.status(200).json({
            conversation: {
                _id: conversation._id,
                otherUser: otherParticipant,
                lastMessage: conversation.lastMessage,
                lastMessageAt: conversation.lastMessageAt
            }
        })
    } catch (error) {
        console.error('Start conversation error:', error)
        res.status(500).json({ error: 'Failed to start conversation' })
    }
}
