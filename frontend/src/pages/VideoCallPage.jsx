import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MessageSquare,
    Maximize2, Minimize2, Send, Users, Clock, AlertCircle
} from 'lucide-react'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { useFirebase } from '../context/FirebaseContext'
import useWebRTC from '../hooks/useWebRTC'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const VideoCallPage = () => {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const { currentUser } = useFirebase()

    const [consultation, setConsultation] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showChat, setShowChat] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [chatInput, setChatInput] = useState('')
    const [callDuration, setCallDuration] = useState(0)
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' })

    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)
    const containerRef = useRef(null)
    const callTimerRef = useRef(null)

    const {
        localStream,
        remoteStream,
        isConnected,
        isAudioMuted,
        isVideoOff,
        isScreenSharing,
        remotePeer,
        connectionState,
        chatMessages,
        error,
        joinRoom,
        leaveRoom,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        sendChatMessage,
        endCall
    } = useWebRTC(roomId, currentUser?.uid, currentUser?.displayName)

    // Fetch consultation details
    useEffect(() => {
        const fetchConsultation = async () => {
            try {
                const response = await fetch(`${API_URL}/api/consultations/room/${roomId}`, {
                    headers: { 'x-user-id': currentUser?.uid }
                })
                if (response.ok) {
                    const data = await response.json()
                    setConsultation(data)
                }
            } catch (err) {
                console.error('Error fetching consultation:', err)
            } finally {
                setLoading(false)
            }
        }

        if (currentUser?.uid) {
            fetchConsultation()
        }
    }, [roomId, currentUser])

    // Attach local stream to video element
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream])

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    // Call duration timer
    useEffect(() => {
        if (connectionState === 'connected' && !callTimerRef.current) {
            callTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)
        }

        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current)
            }
        }
    }, [connectionState])

    // Handle error display
    useEffect(() => {
        if (error) {
            setToast({ show: true, message: error, type: 'error' })
        }
    }, [error])

    // Join room on mount
    useEffect(() => {
        if (isConnected && currentUser?.uid) {
            joinRoom()
        }
    }, [isConnected, currentUser])

    const handleEndCall = async () => {
        endCall()

        // Update consultation status
        if (consultation?._id) {
            try {
                await fetch(`${API_URL}/api/consultations/${consultation._id}/end`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': currentUser?.uid
                    }
                })
            } catch (err) {
                console.error('Error ending consultation:', err)
            }
        }

        navigate('/consultations')
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const handleSendMessage = (e) => {
        e.preventDefault()
        if (chatInput.trim()) {
            sendChatMessage(chatInput)
            setChatInput('')
        }
    }

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
                <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p>Connecting to call...</p>
                </div>
            </div>
        )
    }

    // Determine the other party's name based on current user
    const getOtherPartyName = () => {
        if (!consultation) return 'Video Consultation'

        const isClient = consultation.clientId?._id === currentUser?.uid

        if (isClient) {
            return consultation.lawyerId?.name || 'Lawyer'
        } else {
            return consultation.clientId?.name || 'Client'
        }
    }

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-neutral-900 flex flex-col relative"
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${connectionState === 'connected' ? 'bg-green-500' :
                            connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                'bg-red-500'
                            }`} />
                        <div className="text-white">
                            <h2 className="font-semibold">{getOtherPartyName()}</h2>
                            <div className="flex items-center gap-4 text-sm text-neutral-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatDuration(callDuration)}
                                </span>
                                {remotePeer && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {remotePeer.userName || 'Connected'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-24">
                <div className="relative w-full max-w-6xl aspect-video">
                    {/* Remote Video (Main) */}
                    <div className="w-full h-full bg-neutral-800 rounded-2xl overflow-hidden">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-neutral-700 flex items-center justify-center mb-4">
                                    <Users className="w-12 h-12 text-neutral-500" />
                                </div>
                                <p className="text-neutral-400">
                                    {connectionState === 'connecting' ? 'Connecting...' : 'Waiting for participant...'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Local Video (PiP) */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute bottom-4 right-4 w-48 aspect-video bg-neutral-800 rounded-xl overflow-hidden shadow-lg border-2 border-neutral-700"
                    >
                        {localStream && !isVideoOff ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <VideoOff className="w-8 h-8 text-neutral-500" />
                            </div>
                        )}
                        {isAudioMuted && (
                            <div className="absolute top-2 right-2 p-1 bg-red-500 rounded-full">
                                <MicOff className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={toggleAudio}
                        className={`p-4 rounded-full transition-colors ${isAudioMuted
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-neutral-700 hover:bg-neutral-600'
                            }`}
                    >
                        {isAudioMuted ? (
                            <MicOff className="w-6 h-6 text-white" />
                        ) : (
                            <Mic className="w-6 h-6 text-white" />
                        )}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-colors ${isVideoOff
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-neutral-700 hover:bg-neutral-600'
                            }`}
                    >
                        {isVideoOff ? (
                            <VideoOff className="w-6 h-6 text-white" />
                        ) : (
                            <Video className="w-6 h-6 text-white" />
                        )}
                    </button>

                    <button
                        onClick={toggleScreenShare}
                        className={`p-4 rounded-full transition-colors ${isScreenSharing
                            ? 'bg-primary-500 hover:bg-primary-600'
                            : 'bg-neutral-700 hover:bg-neutral-600'
                            }`}
                    >
                        <Monitor className="w-6 h-6 text-white" />
                    </button>

                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`p-4 rounded-full transition-colors relative ${showChat
                            ? 'bg-primary-500 hover:bg-primary-600'
                            : 'bg-neutral-700 hover:bg-neutral-600'
                            }`}
                    >
                        <MessageSquare className="w-6 h-6 text-white" />
                        {chatMessages.length > 0 && !showChat && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                                {chatMessages.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={handleEndCall}
                        className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    >
                        <PhoneOff className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Chat Sidebar */}
            {showChat && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="absolute top-0 right-0 bottom-0 w-80 bg-neutral-800 border-l border-neutral-700 z-30 flex flex-col"
                >
                    <div className="p-4 border-b border-neutral-700">
                        <h3 className="text-white font-semibold">In-Call Chat</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 ? (
                            <p className="text-neutral-500 text-center text-sm">No messages yet</p>
                        ) : (
                            chatMessages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`p-3 rounded-lg ${msg.from === 'You'
                                        ? 'bg-primary-600 text-white ml-4'
                                        : 'bg-neutral-700 text-white mr-4'
                                        }`}
                                >
                                    <p className="text-xs opacity-70 mb-1">{msg.from}</p>
                                    <p className="text-sm">{msg.message}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 px-3 py-2 bg-neutral-700 text-white rounded-lg border-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button
                                type="submit"
                                className="p-2 bg-primary-600 hover:bg-primary-500 rounded-lg"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
            />

            <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
        </div>
    )
}

export default VideoCallPage
