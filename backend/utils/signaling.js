/**
 * WebRTC Signaling Server using Socket.io
 * Handles peer-to-peer connection setup for video calls (Multi-user Mesh)
 */

const rooms = new Map() // Track active rooms and participants: roomId -> Map(socketId -> { userId, userName, socketId })

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
            
            // Add user to room
            rooms.get(roomId).set(socket.id, { 
                socketId: socket.id, 
                userId, 
                userName 
            })

            // Notify others in the room
            socket.to(roomId).emit('user-joined', {
                socketId: socket.id,
                userId,
                userName
            })

            // Send list of existing users to the new user
            const existingUsers = []
            rooms.get(roomId).forEach((user, sid) => {
                if (sid !== socket.id) {
                    existingUsers.push(user)
                }
            })
            socket.emit('existing-users', existingUsers)
        })

        // WebRTC signaling: Send offer
        socket.on('offer', ({ offer, to, from }) => {
            io.to(to).emit('offer', { offer, from })
        })

        // WebRTC signaling: Send answer
        socket.on('answer', ({ answer, to, from }) => {
            io.to(to).emit('answer', { answer, from })
        })

        // WebRTC signaling: ICE candidate exchange
        socket.on('ice-candidate', ({ candidate, to, from }) => {
            io.to(to).emit('ice-candidate', { candidate, from })
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

        // Handle leaving room explicitly
        socket.on('leave-room', ({ roomId }) => {
            socket.leave(roomId)
            if (rooms.has(roomId)) {
                rooms.get(roomId).delete(socket.id)
                if (rooms.get(roomId).size === 0) {
                    rooms.delete(roomId)
                }
            }
            socket.to(roomId).emit('user-left', { socketId: socket.id })
            console.log(`User left room ${roomId}`)
        })

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`)

            // Clean up from all rooms this socket might be in
            rooms.forEach((users, roomId) => {
                if (users.has(socket.id)) {
                    users.delete(socket.id)
                    socket.to(roomId).emit('user-left', { socketId: socket.id })
                    if (users.size === 0) {
                        rooms.delete(roomId)
                        console.log(`🚪 Room ${roomId} closed (empty)`)
                    }
                }
            })
        })
    })

    console.log('✅ WebRTC Signaling Server initialized (Multi-user)')
}

export default initializeSignalingServer

