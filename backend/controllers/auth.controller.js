import jwt from 'jsonwebtoken'
import User from '../models/User.model.js'

const JWT_SECRET = process.env.JWT_SECRET || 'legalnexus-super-secret-jwt-key-2024'
const JWT_EXPIRES_IN = '7d'

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Register a new user
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const { email, password, name, userType = 'user' } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Please provide email, password, and name' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      userType: userType === 'lawyer' ? 'lawyer' : 'user'
    })

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        photoURL: user.photoURL
      }
    })

  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' })
    }

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate token
    const token = generateToken(user._id)

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        photoURL: user.photoURL,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        location: user.location,
        verified: user.verified,
        verificationStatus: user.verificationStatus
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
}

/**
 * Get current user (verify token)
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET)

    // Get user
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        photoURL: user.photoURL,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        location: user.location,
        verified: user.verified,
        verificationStatus: user.verificationStatus,
        yearsOfExperience: user.yearsOfExperience,
        qualification: user.qualification,
        practiceAreas: user.practiceAreas,
        consultationFees: user.consultationFees,
        rating: user.rating
      }
    })

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    console.error('Get current user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
}

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    const allowedUpdates = ['name', 'phone', 'age', 'gender', 'location', 'photoURL',
      'yearsOfExperience', 'qualification', 'practiceAreas', 'consultationFees']

    const updates = {}
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    })

    const user = await User.findByIdAndUpdate(decoded.id, updates, { new: true })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        photoURL: user.photoURL,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        location: user.location
      }
    })

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

/**
 * Verify JWT token middleware
 */
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    req.user = user
    next()

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
    res.status(500).json({ error: 'Authentication failed' })
  }
}
