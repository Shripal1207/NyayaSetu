import mongoose from 'mongoose'

const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    // Track unread count per participant
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
})

// Index for faster queries
ConversationSchema.index({ participants: 1 })
ConversationSchema.index({ lastMessageAt: -1 })

export default mongoose.model('Conversation', ConversationSchema)
