import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, Clock, Video, VideoOff, User, Phone,
    Star, ChevronRight, XCircle, CheckCircle, AlertCircle,
    MessageSquare, Send, Paperclip, ArrowLeft
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Toast from '../components/ui/Toast'
import Modal from '../components/ui/Modal'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { useFirebase } from '../context/FirebaseContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
}

// Keeping this matching the usage in renderMessagingSection if needed, or define locally there? 
// Actually renderMessagingSection uses it. It should be outside or available.
// I'll define it here.
const formatMessageTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const getStatusBadge = (status) => {
    const badges = {
        scheduled: { color: 'bg-blue-100 text-blue-700', icon: Calendar },
        ongoing: { color: 'bg-green-100 text-green-700', icon: Video },
        completed: { color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
        cancelled: { color: 'bg-red-100 text-red-700', icon: XCircle },
        'no-show': { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle }
    }
    const badge = badges[status] || badges.scheduled
    const Icon = badge.icon

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
            <Icon className="w-3 h-3" />
            {status}
        </span>
    )
}

const canJoinCall = (consultation) => {
    const now = new Date()
    const scheduledTime = new Date(consultation.scheduledAt)
    const timeDiff = scheduledTime - now
    // Allow joining 30 mins before 
    return timeDiff <= 30 * 60 * 1000 && consultation.status === 'scheduled'
}

// Video Consultation Card
const ConsultationCard = ({ consultation, onCancel }) => {
    const { currentUser } = useFirebase()
    const navigate = useNavigate()

    const isClient = consultation.clientId?._id === currentUser?.uid
    const otherParty = isClient ? consultation.lawyerId : consultation.clientId

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                        {otherParty?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-neutral-900">{otherParty?.name || 'User'}</h3>
                        <p className="text-sm text-neutral-500">
                            {isClient ? 'Advocate' : 'Client'}
                        </p>
                    </div>
                </div>
                {getStatusBadge(consultation.status)}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="flex items-center gap-2 text-neutral-600">
                    <Calendar className="w-4 h-4" />
                    {formatDate(consultation.scheduledAt)}
                </div>
                <div className="flex items-center gap-2 text-neutral-600">
                    <Clock className="w-4 h-4" />
                    {formatTime(consultation.scheduledAt)} ({consultation.duration}m)
                </div>
            </div>

            {consultation.clientNotes && (
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                    {consultation.clientNotes}
                </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
                <p className="font-semibold text-primary-600">₹{consultation.fee}</p>

                <div className="flex gap-2">
                    {consultation.status === 'scheduled' && (
                        <>
                            {canJoinCall(consultation) && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate(`/call/${consultation.roomId}`)}
                                >
                                    <Video className="w-4 h-4 mr-1" />
                                    Join Call
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => onCancel(consultation)}
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                    {consultation.status === 'completed' && !consultation.clientRating && isClient && (
                        <Button variant="ghost" size="sm">
                            <Star className="w-4 h-4 mr-1" />
                            Rate
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

const ConversationItem = ({ conversation, isSelected, onSelect }) => {
    return (
        <button
            onClick={() => onSelect(conversation)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${isSelected ? 'bg-primary-50' : ''
                }`}
        >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                {conversation.otherUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-neutral-900 truncate">
                        {conversation.otherUser?.name || 'User'}
                    </h4>
                    <span className="text-xs text-neutral-500">
                        {conversation.lastMessage && new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p className="text-sm text-neutral-500 truncate">
                    {conversation.lastMessage?.content || 'No messages yet'}
                </p>
            </div>
            {conversation.unreadCount > 0 && (
                <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    {conversation.unreadCount}
                </span>
            )}
        </button>
    )
}

const ConsultationsPage = () => {
    const navigate = useNavigate()
    const { currentUser } = useFirebase()
    const location = useLocation()

    // Main section toggle: 'messaging' or 'video'
    const [consultationType, setConsultationType] = useState('messaging')
    const [consultations, setConsultations] = useState({ upcoming: [], past: [] })
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('upcoming')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [selectedConsultation, setSelectedConsultation] = useState(null)
    const [cancelReason, setCancelReason] = useState('')
    const [cancelling, setCancelling] = useState(false)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })

    // Messaging state
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        if (currentUser?.uid) {
            // Check for conversation in state
            if (location.state?.conversation) {
                setConsultationType('messaging')
                setSelectedConversation(location.state.conversation)
                fetchMessages(location.state.conversation._id)
                // Clear state to prevent reopening on refresh if desired, 
                // but usually fine to keep until navigated away
            }

            if (consultationType === 'video') {
                fetchConsultations()
            } else {
                fetchConversations()
            }
        }
    }, [currentUser, consultationType, location.state])

    const fetchConsultations = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/consultations/my`, {
                headers: { 'x-user-id': currentUser?.uid }
            })
            if (response.ok) {
                const data = await response.json()
                setConsultations(data)
            }
        } catch (error) {
            console.error('Error fetching consultations:', error)
            setToast({ show: true, message: 'Failed to load consultations', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const fetchConversations = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/messages/conversations`, {
                headers: { 'x-user-id': currentUser?.uid }
            })
            if (response.ok) {
                const data = await response.json()
                setConversations(data.conversations || [])
            }
        } catch (error) {
            console.error('Error fetching conversations:', error)
            // Set empty conversations if fetch fails
            setConversations([])
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (conversationId) => {
        try {
            const response = await fetch(`${API_URL}/api/messages/${conversationId}`, {
                headers: { 'x-user-id': currentUser?.uid }
            })
            if (response.ok) {
                const data = await response.json()
                setMessages(data.messages || [])
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return

        setSendingMessage(true)
        try {
            const response = await fetch(`${API_URL}/api/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser?.uid
                },
                body: JSON.stringify({
                    conversationId: selectedConversation._id,
                    receiverId: selectedConversation.otherUser?._id,
                    content: newMessage
                })
            })

            if (response.ok) {
                const data = await response.json()
                setMessages(prev => [...prev, data.message])
                setNewMessage('')
                scrollToBottom()
            }
        } catch (error) {
            console.error('Error sending message:', error)
            setToast({ show: true, message: 'Failed to send message', type: 'error' })
        } finally {
            setSendingMessage(false)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleCancelConsultation = async () => {
        if (!selectedConsultation) return

        setCancelling(true)
        try {
            const response = await fetch(`${API_URL}/api/consultations/${selectedConsultation._id}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser?.uid
                },
                body: JSON.stringify({ reason: cancelReason })
            })

            if (response.ok) {
                setToast({ show: true, message: 'Consultation cancelled', type: 'success' })
                fetchConsultations()
                setShowCancelModal(false)
                setCancelReason('')
            } else {
                const data = await response.json()
                setToast({ show: true, message: data.error, type: 'error' })
            }
        } catch (error) {
            setToast({ show: true, message: 'Failed to cancel', type: 'error' })
        } finally {
            setCancelling(false)
        }
    }





    // Messaging Interface
    const renderMessagingSection = () => {
        if (selectedConversation) {
            return (
                <div className="flex flex-col h-[600px] bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 p-4 border-b bg-neutral-50">
                        <button
                            onClick={() => setSelectedConversation(null)}
                            className="md:hidden p-2 hover:bg-neutral-200 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
                            {selectedConversation.otherUser?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h4 className="font-semibold text-neutral-900">
                                {selectedConversation.otherUser?.name}
                            </h4>
                            <p className="text-xs text-neutral-500">
                                {selectedConversation.otherUser?.userType === 'lawyer' ? 'Advocate' : 'Client'}
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23c4c4c4\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                        {messages.length === 0 ? (
                            <div className="text-center py-12 text-neutral-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                // Fix: Compare with MongoDB _id properly
                                const senderId = msg.senderId?._id || msg.senderId
                                const isOwn = senderId === currentUser?.uid || senderId === currentUser?.mongoId
                                const isRead = msg.read

                                return (
                                    <div
                                        key={msg._id || index}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-3 py-2 rounded-lg shadow-sm relative ${isOwn
                                                ? 'bg-[#dcf8c6] text-neutral-900 rounded-tr-none'
                                                : 'bg-white text-neutral-900 rounded-tl-none'
                                                }`}
                                        >
                                            {/* Sender name for received messages */}
                                            {!isOwn && msg.senderId?.name && (
                                                <p className="text-xs font-semibold text-primary-600 mb-1">
                                                    {msg.senderId.name}
                                                </p>
                                            )}

                                            <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>

                                            {/* Time and read receipt */}
                                            <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? '-mr-1' : ''}`}>
                                                <span className="text-[11px] text-neutral-500">
                                                    {formatMessageTime(msg.createdAt)}
                                                </span>

                                                {/* WhatsApp-style double ticks */}
                                                {isOwn && (
                                                    <span className={`text-[14px] ${isRead ? 'text-blue-500' : 'text-neutral-400'}`}>
                                                        {isRead ? (
                                                            // Double blue ticks (read)
                                                            <svg viewBox="0 0 16 11" width="16" height="11" className="inline">
                                                                <path
                                                                    fill="currentColor"
                                                                    d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.147.47.47 0 0 0-.343.151.435.435 0 0 0-.127.319.46.46 0 0 0 .142.312l2.726 2.574c.078.074.172.112.276.122.103.01.213-.019.305-.091l6.516-8.036a.453.453 0 0 0 .108-.31.464.464 0 0 0-.154-.298z"
                                                                />
                                                                <path
                                                                    fill="currentColor"
                                                                    d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.203-1.135a.108.108 0 0 0-.064-.018.108.108 0 0 0-.062.024l-.645.686 1.86 1.757c.078.073.171.111.275.121.103.01.213-.019.305-.091l6.516-8.036a.453.453 0 0 0 .108-.31.465.465 0 0 0-.155-.298z"
                                                                />
                                                            </svg>
                                                        ) : (
                                                            // Double grey ticks (delivered)
                                                            <svg viewBox="0 0 16 11" width="16" height="11" className="inline">
                                                                <path
                                                                    fill="currentColor"
                                                                    d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.147.47.47 0 0 0-.343.151.435.435 0 0 0-.127.319.46.46 0 0 0 .142.312l2.726 2.574c.078.074.172.112.276.122.103.01.213-.019.305-.091l6.516-8.036a.453.453 0 0 0 .108-.31.464.464 0 0 0-.154-.298z"
                                                                />
                                                                <path
                                                                    fill="currentColor"
                                                                    d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.203-1.135a.108.108 0 0 0-.064-.018.108.108 0 0 0-.062.024l-.645.686 1.86 1.757c.078.073.171.111.275.121.103.01.213-.019.305-.091l6.516-8.036a.453.453 0 0 0 .108-.31.465.465 0 0 0-.155-.298z"
                                                                />
                                                            </svg>
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Message tail */}
                                            <div className={`absolute top-0 w-3 h-3 ${isOwn
                                                ? 'right-[-6px] bg-[#dcf8c6]'
                                                : 'left-[-6px] bg-white'
                                                }`} style={{
                                                    clipPath: isOwn
                                                        ? 'polygon(0 0, 100% 0, 0 100%)'
                                                        : 'polygon(100% 0, 0 0, 100% 100%)'
                                                }} />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-white">
                        <div className="flex gap-2">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        sendMessage()
                                    }
                                }}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[46px] max-h-[120px]"
                                rows={1}
                            />
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={sendMessage}
                                disabled={!newMessage.trim() || sendingMessage}
                                className="rounded-full px-4"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="grid md:grid-cols-3 gap-6">
                {/* Conversations List */}
                <div className="md:col-span-1 bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    <div className="p-4 border-b bg-neutral-50">
                        <h3 className="font-semibold text-neutral-900">Conversations</h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                                <p className="mb-4">No conversations yet</p>
                                <Button size="sm" onClick={() => navigate('/lawyers')}>
                                    Find an Advocate
                                </Button>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <ConversationItem
                                    key={conv._id}
                                    conversation={conv}
                                    isSelected={selectedConversation?._id === conv._id}
                                    onSelect={(c) => {
                                        setSelectedConversation(c)
                                        fetchMessages(c._id)
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Empty Chat State */}
                <div className="md:col-span-2 bg-white rounded-xl border border-neutral-200 flex items-center justify-center h-[500px]">
                    <div className="text-center text-neutral-500">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Select a conversation</h3>
                        <p>Choose a conversation from the list to start messaging</p>
                    </div>
                </div>
            </div>
        )
    }

    // Video Consultations Section
    const renderVideoSection = () => (
        <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'upcoming'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                >
                    Upcoming ({consultations.upcoming?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'past'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100'
                        }`}
                >
                    Past ({consultations.past?.length || 0})
                </button>
            </div>

            {/* Consultations List */}
            {activeTab === 'upcoming' && (
                <div>
                    {consultations.upcoming?.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                    No upcoming video consultations
                                </h3>
                                <p className="text-neutral-600 mb-6">
                                    Book a video consultation with a verified advocate
                                </p>
                                <Button onClick={() => navigate('/lawyers')}>
                                    Find Advocates
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {consultations.upcoming.map((consultation) => (
                                <ConsultationCard
                                    key={consultation._id}
                                    consultation={consultation}
                                    onCancel={(c) => {
                                        setSelectedConsultation(c)
                                        setShowCancelModal(true)
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'past' && (
                <div>
                    {consultations.past?.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Clock className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                    No past consultations
                                </h3>
                                <p className="text-neutral-600">
                                    Your completed video consultations will appear here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {consultations.past.map((consultation) => (
                                <ConsultationCard
                                    key={consultation._id}
                                    consultation={consultation}
                                    onCancel={(c) => {
                                        setSelectedConsultation(c)
                                        setShowCancelModal(true)
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                                Consultations
                            </h1>
                            <p className="text-neutral-600">
                                Communicate with advocates via messaging or video calls
                            </p>
                        </div>
                        <Button onClick={() => navigate('/lawyers')}>
                            Book Consultation
                        </Button>
                    </div>

                    {/* Section Toggle */}
                    <div className="flex gap-1 p-1 bg-neutral-200 rounded-xl mb-8 max-w-md">
                        <button
                            onClick={() => setConsultationType('messaging')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${consultationType === 'messaging'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            Messaging
                        </button>
                        <button
                            onClick={() => setConsultationType('video')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${consultationType === 'video'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                        >
                            <Video className="w-5 h-5" />
                            Video Calls
                        </button>
                    </div>

                    {/* Content based on type */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={consultationType}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {consultationType === 'messaging' ? renderMessagingSection() : renderVideoSection()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Cancel Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false)
                    setCancelReason('')
                    setSelectedConsultation(null)
                }}
                title="Cancel Consultation"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-neutral-600">
                        Are you sure you want to cancel this consultation? Please provide a reason.
                    </p>
                    <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation..."
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={3}
                    />
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setShowCancelModal(false)}
                            className="flex-1"
                        >
                            Keep Booking
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCancelConsultation}
                            isLoading={cancelling}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            Cancel Consultation
                        </Button>
                    </div>
                </div>
            </Modal>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </div>
    )
}

export default ConsultationsPage
