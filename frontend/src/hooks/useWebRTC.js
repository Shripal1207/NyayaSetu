/**
 * WebRTC Hook
 * Manages peer-to-peer video connections for multi-user calls
 * Handles media streams, signaling, peer connection lifecycle, and chat
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const SOCKET_URL = API_URL.replace('/api', ''); // Ensure correct base URL for socket

// ICE server configuration for WebRTC
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ],
};

export const useWebRTC = (roomId, userId, userName) => {
    // Media & Connection State
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // Map: socketId -> stream
    const [participants, setParticipants] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // Controls State
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Chat & Meta State
    const [chatMessages, setChatMessages] = useState([]);
    const [error, setError] = useState(null);

    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const originalVideoTrackRef = useRef(null);

    // Initialize media stream
    const initializeMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            localStreamRef.current = stream;
            originalVideoTrackRef.current = stream.getVideoTracks()[0];
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('Failed to get media devices:', err);
            setError('Failed to access camera/microphone. Please check permissions.');
            throw err;
        }
    }, []);

    // Create peer connection for a remote user
    const createPeerConnection = useCallback((remoteSocketId) => {
        const peerConnection = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks to peer connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: remoteSocketId,
                    from: socketRef.current.id,
                });
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setRemoteStreams((prev) => ({
                ...prev,
                [remoteSocketId]: remoteStream,
            }));
        };

        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection state with ${remoteSocketId}: ${peerConnection.connectionState}`);
        };

        peerConnectionsRef.current[remoteSocketId] = peerConnection;
        return peerConnection;
    }, []);

    // Initialize WebRTC and Socket.IO
    const joinRoom = useCallback(async () => {
        if (!roomId || !userId) return;

        try {
            // Initialize media first
            await initializeMedia();

            // Connect to Socket.IO
            socketRef.current = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
            });

            socketRef.current.on('connect', () => {
                setIsConnected(true);
                console.log('Socket connected:', socketRef.current.id);

                // Join the room
                socketRef.current.emit('join-room', {
                    roomId,
                    userId,
                    userName,
                });
            });

            socketRef.current.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setError('Failed to connect to signaling server');
            });

            // Handle existing users in room
            socketRef.current.on('existing-users', async (users) => {
                setParticipants(users);

                // Create offers for each existing user
                for (const user of users) {
                    const pc = createPeerConnection(user.socketId);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    socketRef.current.emit('offer', {
                        offer,
                        to: user.socketId,
                        from: socketRef.current.id,
                    });
                }
            });

            // Handle new user joining
            socketRef.current.on('user-joined', async ({ socketId, userId: uid, userName: uname }) => {
                console.log('User joined:', uname);
                setParticipants((prev) => [...prev, { socketId, userId: uid, userName: uname }]);
            });

            // Handle incoming offer
            socketRef.current.on('offer', async ({ offer, from }) => {
                const pc = createPeerConnection(from);
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                socketRef.current.emit('answer', {
                    answer,
                    to: from,
                    from: socketRef.current.id,
                });
            });

            // Handle incoming answer
            socketRef.current.on('answer', async ({ answer, from }) => {
                const pc = peerConnectionsRef.current[from];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                }
            });

            // Handle incoming ICE candidate
            socketRef.current.on('ice-candidate', async ({ candidate, from }) => {
                const pc = peerConnectionsRef.current[from];
                if (pc) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (err) {
                        console.error('Error adding ICE candidate:', err);
                    }
                }
            });

            // Handle user leaving
            socketRef.current.on('user-left', ({ socketId }) => {
                setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
                setRemoteStreams((prev) => {
                    const updated = { ...prev };
                    delete updated[socketId];
                    return updated;
                });

                // Close peer connection
                if (peerConnectionsRef.current[socketId]) {
                    peerConnectionsRef.current[socketId].close();
                    delete peerConnectionsRef.current[socketId];
                }
            });

            // Chat handlers
            socketRef.current.on('chat-message', (message) => {
                setChatMessages((prev) => [...prev, message]);
            });

            socketRef.current.on('disconnect', () => {
                setIsConnected(false);
            });

        } catch (err) {
            console.error('Failed to join room:', err);
            setError(err.message);
        }
    }, [roomId, userId, userName, initializeMedia, createPeerConnection]);

    // Leave room and cleanup
    const leaveRoom = useCallback(() => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Stop screen sharing stream
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Close all peer connections
        Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
        peerConnectionsRef.current = {};

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.emit('leave-room', { roomId });
            socketRef.current.disconnect();
        }

        setLocalStream(null);
        setRemoteStreams({});
        setParticipants([]);
        setIsConnected(false);
        setIsScreenSharing(false);
    }, [roomId]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);

                if (socketRef.current) {
                    socketRef.current.emit('toggle-audio', { roomId, muted: !audioTrack.enabled });
                }
            }
        }
    }, [roomId]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);

                if (socketRef.current) {
                    socketRef.current.emit('toggle-video', { roomId, hidden: !videoTrack.enabled });
                }
            }
        }
    }, [roomId]);

    // Toggle screen sharing
    const toggleScreenShare = useCallback(async () => {
        try {
            if (!isScreenSharing) {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false,
                });

                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace video track in all peer connections
                Object.values(peerConnectionsRef.current).forEach((pc) => {
                    const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                });

                // Update local stream for preview
                const newStream = new MediaStream([
                    ...localStreamRef.current.getAudioTracks(),
                    screenTrack,
                ]);
                setLocalStream(newStream);
                setIsScreenSharing(true);

                if (socketRef.current) {
                    socketRef.current.emit('screen-share-started', { roomId });
                }

                // Handle when user stops sharing from browser UI
                screenTrack.onended = () => {
                    stopScreenShare();
                };
            } else {
                stopScreenShare();
            }
        } catch (err) {
            console.error('Screen sharing error:', err);
            if (err.name !== 'NotAllowedError') { // Don't setError on user cancel
                setError('Failed to share screen.');
            }
            setIsScreenSharing(false);
        }
    }, [isScreenSharing, roomId]);

    // Stop screen sharing helper
    const stopScreenShare = useCallback(async () => {
        // Stop screen stream
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }

        // Restore camera video track
        if (originalVideoTrackRef.current) {
            // Replace screen track with camera track in all peer connections
            Object.values(peerConnectionsRef.current).forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                if (sender && originalVideoTrackRef.current) {
                    sender.replaceTrack(originalVideoTrackRef.current);
                }
            });

            // Update local stream
            const newStream = new MediaStream([
                ...localStreamRef.current.getAudioTracks(),
                originalVideoTrackRef.current,
            ]);
            setLocalStream(newStream);
        }

        setIsScreenSharing(false);
        if (socketRef.current) {
            socketRef.current.emit('screen-share-stopped', { roomId });
        }
    }, [roomId]);

    // Send chat message
    const sendChatMessage = useCallback((message) => {
        if (socketRef.current && roomId && message.trim()) {
            const msgData = { roomId, message };
            socketRef.current.emit('chat-message', msgData);
            // Optimistic UI update
            setChatMessages((prev) => [...prev, {
                from: 'You',
                message,
                timestamp: new Date().toISOString()
            }]);
        }
    }, [roomId]);

    // End call
    const endCall = useCallback(() => {
        if (socketRef.current && roomId) {
            socketRef.current.emit('end-call', { roomId });
        }
        leaveRoom();
    }, [roomId, leaveRoom]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveRoom();
        };
    }, []); // Empty dependency array to run only on unmount (or when joinRoom hasn't run yet)

    return {
        localStream,
        remoteStreams,
        participants,
        isConnected,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        chatMessages,
        error,
        joinRoom,
        leaveRoom,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        sendChatMessage,
        endCall,
    };
};

export default useWebRTC;
