import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ]
}

export const useWebRTC = (roomId, userId, userName) => {
    const [socket, setSocket] = useState(null)
    const [localStream, setLocalStream] = useState(null)
    const [remoteStream, setRemoteStream] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isAudioMuted, setIsAudioMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)
    const [isScreenSharing, setIsScreenSharing] = useState(false)
    const [remotePeer, setRemotePeer] = useState(null)
    const [connectionState, setConnectionState] = useState('disconnected')
    const [chatMessages, setChatMessages] = useState([])
    const [error, setError] = useState(null)

    const peerConnectionRef = useRef(null)
    const screenStreamRef = useRef(null)
    const originalVideoTrackRef = useRef(null)

    // Initialize socket connection
    useEffect(() => {
        if (!roomId) return

        const newSocket = io(API_URL, {
            transports: ['websocket', 'polling']
        })

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id)
            setIsConnected(true)
        })

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected')
            setIsConnected(false)
        })

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err)
            setError('Failed to connect to signaling server')
        })

        setSocket(newSocket)

        return () => {
            newSocket.close()
        }
    }, [roomId])

    // Get local media stream
    const initializeMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })

            setLocalStream(stream)
            originalVideoTrackRef.current = stream.getVideoTracks()[0]
            return stream

        } catch (err) {
            console.error('Error getting media:', err)
            setError('Failed to access camera/microphone. Please check permissions.')
            throw err
        }
    }, [])

    // Create peer connection
    const createPeerConnection = useCallback((stream) => {
        const pc = new RTCPeerConnection(ICE_SERVERS)

        // Add local tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream)
        })

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track')
            setRemoteStream(event.streams[0])
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket && remotePeer) {
                socket.emit('ice-candidate', {
                    to: remotePeer.id,
                    candidate: event.candidate
                })
            }
        }

        // Monitor connection state
        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState)
            setConnectionState(pc.connectionState)
        }

        pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pc.iceConnectionState)
        }

        peerConnectionRef.current = pc
        return pc

    }, [socket, remotePeer])

    // Join room
    const joinRoom = useCallback(async () => {
        if (!socket || !roomId) return

        try {
            const stream = await initializeMedia()

            socket.emit('join-room', { roomId, userId, userName })

            // Handle user joined
            socket.on('user-joined', async (peer) => {
                console.log('User joined:', peer.userName)
                setRemotePeer(peer)

                const pc = createPeerConnection(stream)

                // Create and send offer
                const offer = await pc.createOffer()
                await pc.setLocalDescription(offer)

                socket.emit('offer', { to: peer.id, offer })
            })

            // Handle room participants (existing users)
            socket.on('room-participants', async (participants) => {
                if (participants.length > 0) {
                    const peer = participants[0]
                    setRemotePeer(peer)
                    createPeerConnection(stream)
                }
            })

            // Handle offer
            socket.on('offer', async ({ from, offer }) => {
                console.log('Received offer from:', from)
                setRemotePeer({ id: from })

                const pc = createPeerConnection(stream)
                await pc.setRemoteDescription(new RTCSessionDescription(offer))

                const answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                socket.emit('answer', { to: from, answer })
            })

            // Handle answer
            socket.on('answer', async ({ from, answer }) => {
                console.log('Received answer from:', from)
                const pc = peerConnectionRef.current
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer))
                }
            })

            // Handle ICE candidate
            socket.on('ice-candidate', async ({ from, candidate }) => {
                const pc = peerConnectionRef.current
                if (pc && candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate))
                    } catch (err) {
                        console.error('Error adding ICE candidate:', err)
                    }
                }
            })

            // Handle user left
            socket.on('user-left', ({ userName }) => {
                console.log('User left:', userName)
                setRemotePeer(null)
                setRemoteStream(null)
                if (peerConnectionRef.current) {
                    peerConnectionRef.current.close()
                    peerConnectionRef.current = null
                }
            })

            // Handle chat messages
            socket.on('chat-message', (message) => {
                setChatMessages(prev => [...prev, message])
            })

            // Handle peer audio toggle
            socket.on('peer-audio-toggle', ({ muted }) => {
                console.log('Peer audio muted:', muted)
            })

            // Handle peer video toggle
            socket.on('peer-video-toggle', ({ hidden }) => {
                console.log('Peer video hidden:', hidden)
            })

            // Handle call ended
            socket.on('call-ended', ({ by }) => {
                console.log('Call ended by:', by)
                leaveRoom()
            })

        } catch (err) {
            console.error('Error joining room:', err)
            setError('Failed to join the call')
        }
    }, [socket, roomId, userId, userName, initializeMedia, createPeerConnection])

    // Leave room
    const leaveRoom = useCallback(() => {
        if (socket && roomId) {
            socket.emit('leave-room', { roomId })
        }

        // Stop all tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop())
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop())
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
            peerConnectionRef.current = null
        }

        setLocalStream(null)
        setRemoteStream(null)
        setRemotePeer(null)
        setConnectionState('disconnected')

    }, [socket, roomId, localStream])

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsAudioMuted(!audioTrack.enabled)

                if (socket && roomId) {
                    socket.emit('toggle-audio', { roomId, muted: !audioTrack.enabled })
                }
            }
        }
    }, [localStream, socket, roomId])

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsVideoOff(!videoTrack.enabled)

                if (socket && roomId) {
                    socket.emit('toggle-video', { roomId, hidden: !videoTrack.enabled })
                }
            }
        }
    }, [localStream, socket, roomId])

    // Toggle screen share
    const toggleScreenShare = useCallback(async () => {
        if (!peerConnectionRef.current) return

        try {
            if (isScreenSharing) {
                // Stop screen share, restore camera
                if (originalVideoTrackRef.current) {
                    const sender = peerConnectionRef.current.getSenders()
                        .find(s => s.track?.kind === 'video')
                    if (sender) {
                        await sender.replaceTrack(originalVideoTrackRef.current)
                    }

                    // Update local stream to show camera again
                    if (localStream) {
                        const videoTrack = localStream.getVideoTracks()[0]
                        if (videoTrack) {
                            localStream.removeTrack(videoTrack)
                        }
                        localStream.addTrack(originalVideoTrackRef.current)
                        setLocalStream(new MediaStream(localStream.getTracks()))
                    }
                }
                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach(track => track.stop())
                    screenStreamRef.current = null
                }
                setIsScreenSharing(false)
                if (socket && roomId) {
                    socket.emit('screen-share-stopped', { roomId })
                }

            } else {
                // Start screen share
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                })

                screenStreamRef.current = screenStream
                const screenTrack = screenStream.getVideoTracks()[0]

                const sender = peerConnectionRef.current.getSenders()
                    .find(s => s.track?.kind === 'video')
                if (sender) {
                    await sender.replaceTrack(screenTrack)
                }

                // Update local stream to show screen share preview
                if (localStream) {
                    const videoTrack = localStream.getVideoTracks()[0]
                    if (videoTrack) {
                        localStream.removeTrack(videoTrack)
                    }
                    localStream.addTrack(screenTrack)
                    setLocalStream(new MediaStream(localStream.getTracks()))
                }

                // Handle screen share ended by user (clicking stop in browser)
                screenTrack.onended = () => {
                    toggleScreenShare()
                }

                setIsScreenSharing(true)
                if (socket && roomId) {
                    socket.emit('screen-share-started', { roomId })
                }
            }

        } catch (err) {
            console.error('Screen share error:', err)
            // Don't show error if user simply cancelled the dialog
            if (err.name === 'NotAllowedError') {
                // User cancelled - this is expected, no need for error message
                console.log('Screen share cancelled by user')
            } else {
                setError('Failed to share screen. Please try again.')
            }
        }
    }, [isScreenSharing, socket, roomId, localStream])

    // Send chat message
    const sendChatMessage = useCallback((message) => {
        if (socket && roomId && message.trim()) {
            socket.emit('chat-message', { roomId, message })
            setChatMessages(prev => [...prev, {
                from: 'You',
                message,
                timestamp: new Date().toISOString()
            }])
        }
    }, [socket, roomId])

    // End call
    const endCall = useCallback(() => {
        if (socket && roomId) {
            socket.emit('end-call', { roomId })
        }
        leaveRoom()
    }, [socket, roomId, leaveRoom])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveRoom()
        }
    }, [])

    return {
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
    }
}

export default useWebRTC
