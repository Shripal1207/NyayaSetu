import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.route.js'
import userRoutes from './routes/user.route.js'
import verificationRoutes from './routes/verification.route.js'
import adminRoutes from './routes/admin.route.js'
import consultationRoutes from './routes/consultation.route.js'
import messageRoutes from './routes/message.route.js'
import initializeSignalingServer from './utils/signaling.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 5000

// Initialize Socket.io for WebRTC signaling
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// Initialize WebRTC signaling server
initializeSignalingServer(io)

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// CORS Configuration - must be before other middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['*']

console.log('🔒 CORS Allowed Origins:', allowedOrigins)

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.log('❌ CORS blocked origin:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-User-Id', 'x-user-id', 'Cache-Control']
}

// Middleware - CORS must be first
app.use(cors(corsOptions))
app.options('*', cors(corsOptions)) // Enable preflight for all routes
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/api/', limiter)

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err)
    process.exit(1)
  })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/verification', verificationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/consultations', consultationRoutes)
app.use('/api/messages', messageRoutes)

// Health check at root for Render
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'LegalNexus Backend API' })
})

// Health check at /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'LegalNexus API is running',
    timestamp: new Date().toISOString(),
    features: {
      videoConsultation: true,
      socketConnected: io.engine.clientsCount
    }
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 WebRTC Signaling ready`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
})
