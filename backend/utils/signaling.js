/**
 * WebRTC Signaling Server using Socket.io
 * Handles peer-to-peer connection setup for video calls
 */

const rooms = new Map() // Track active rooms and participants

export const initializeSignalingServer = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`)

        // Join a video call room
        socket.on('join-room', ({ roomId, userId, userName }) => {
            console.log(`👤 ${userName} joining room: ${roomId}`)

            socket.join(roomId)
            socket.roomId = roomId
            socket.userId = userId
            socket.userName = userName

            // Track room participants
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Map())
            }
            rooms.get(roomId).set(socket.id, { id: socket.id, oduserId: userId, userName })

            // Notify others in the room
            socket.to(roomId).emit('user-joined', {
                id: socket.id,
                userId,
                userName
            })

            // Send current participants to the new user
            const participants = Array.from(rooms.get(roomId).values())
                .filter(p => p.id !== socket.id)
            socket.emit('room-participants', participants)
        })

        // Handle WebRTC offer
        socket.on('offer', ({ to, offer }) => {
            console.log(`📤 Offer from ${socket.id} to ${to}`)
            socket.to(to).emit('offer', {
                from: socket.id,
                offer
            })
        })

        // Handle WebRTC answer
        socket.on('answer', ({ to, answer }) => {
            console.log(`📥 Answer from ${socket.id} to ${to}`)
            socket.to(to).emit('answer', {
                from: socket.id,
                answer
            })
        })

        // Handle ICE candidates
        socket.on('ice-candidate', ({ to, candidate }) => {
            socket.to(to).emit('ice-candidate', {
                from: socket.id,
                candidate
            })
        })

        // Handle mute/unmute audio
        socket.on('toggle-audio', ({ roomId, muted }) => {
            socket.to(roomId).emit('peer-audio-toggle', {
                peerId: socket.id,
                muted
            })
        })

        // Handle video on/off
        socket.on('toggle-video', ({ roomId, hidden }) => {
            socket.to(roomId).emit('peer-video-toggle', {
                peerId: socket.id,
                hidden
            })
        })

        // Handle screen share
        socket.on('screen-share-started', ({ roomId }) => {
            socket.to(roomId).emit('peer-screen-share', {
                peerId: socket.id,
                sharing: true
            })
        })

        socket.on('screen-share-stopped', ({ roomId }) => {
            socket.to(roomId).emit('peer-screen-share', {
                peerId: socket.id,
                sharing: false
            })
        })

        // Handle chat messages in call
        socket.on('chat-message', ({ roomId, message }) => {
            socket.to(roomId).emit('chat-message', {
                from: socket.userName || 'Anonymous',
                message,
                timestamp: new Date().toISOString()
            })
        })

        // Handle call ended
        socket.on('end-call', ({ roomId }) => {
            socket.to(roomId).emit('call-ended', {
                by: socket.userName
            })
        })

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`)

            const roomId = socket.roomId
            if (roomId && rooms.has(roomId)) {
                rooms.get(roomId).delete(socket.id)

                // Notify others that user left
                socket.to(roomId).emit('user-left', {
                    id: socket.id,
                    userName: socket.userName
                })

                // Clean up empty rooms
                if (rooms.get(roomId).size === 0) {
                    rooms.delete(roomId)
                    console.log(`🚪 Room ${roomId} closed (empty)`)
                }
            }
        })

        // Handle leaving room (without disconnect)
        socket.on('leave-room', ({ roomId }) => {
            socket.leave(roomId)

            if (rooms.has(roomId)) {
                rooms.get(roomId).delete(socket.id)

                socket.to(roomId).emit('user-left', {
                    id: socket.id,
                    userName: socket.userName
                })

                if (rooms.get(roomId).size === 0) {
                    rooms.delete(roomId)
                }
            }
        })
    })

    console.log('✅ WebRTC Signaling Server initialized')
}

export default initializeSignalingServer
