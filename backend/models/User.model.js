import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 18,
    max: 120
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    lowercase: true
  },
  location: {
    type: String,
    trim: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  photoURL: {
    type: String,
    default: ''
  },
  userType: {
    type: String,
    enum: ['user', 'lawyer', 'admin'],
    default: 'user'
  },
  // Lawyer-specific fields
  yearsOfExperience: {
    type: Number,
    min: 0
  },
  qualification: {
    type: String,
    trim: true
  },
  practiceAreas: [{
    type: String,
    trim: true
  }],
  consultationFees: {
    type: Number,
    min: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  // Lawyer verification fields
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  barCouncilNumber: {
    type: String,
    trim: true
  },
  barCouncilState: {
    type: String,
    trim: true
  },
  barCouncilIdCardUrl: {
    type: String,
    trim: true
  },
  barCouncilIdCardPublicId: {
    type: String,
    trim: true
  },
  verificationSubmittedAt: {
    type: Date
  },
  verificationReviewedAt: {
    type: Date
  },
  verificationReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationRejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Geospatial index
userSchema.index({ coordinates: '2dsphere' })

const User = mongoose.model('User', userSchema)

export default User

