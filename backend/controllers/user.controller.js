import User from '../models/User.model.js'

// Get user by ID (MongoDB _id)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Error fetching user',
      details: error.message
    })
  }
}

// Get user by MongoDB _id
export const getUserByMongoId = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {
    console.error('Get user by mongo id error:', error)
    res.status(500).json({
      error: 'Error fetching user',
      details: error.message
    })
  }
}

// Get nearby lawyers
export const getNearbyLawyers = async (req, res) => {
  try {
    const { longitude, latitude, radius = 10 } = req.query

    if (!longitude || !latitude) {
      return res.status(400).json({
        error: 'Longitude and latitude are required'
      })
    }

    const lawyers = await User.find({
      userType: 'lawyer',
      verificationStatus: 'verified', // Only verified lawyers
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      }
    }).limit(50)

    res.status(200).json({
      count: lawyers.length,
      lawyers
    })
  } catch (error) {
    console.error('Get nearby lawyers error:', error)
    res.status(500).json({
      error: 'Error fetching lawyers',
      details: error.message
    })
  }
}

// Get all lawyers
export const getAllLawyers = async (req, res) => {
  try {
    const { practiceArea, minExperience, maxFees } = req.query

    const filter = {
      userType: 'lawyer',
      verificationStatus: 'verified' // Only verified lawyers
    }

    if (practiceArea) {
      filter.practiceAreas = practiceArea
    }

    if (minExperience) {
      filter.yearsOfExperience = { $gte: parseInt(minExperience) }
    }

    if (maxFees) {
      filter.consultationFees = { $lte: parseInt(maxFees) }
    }

    const lawyers = await User.find(filter).limit(100)

    res.status(200).json({
      count: lawyers.length,
      lawyers
    })
  } catch (error) {
    console.error('Get all lawyers error:', error)
    res.status(500).json({
      error: 'Error fetching lawyers',
      details: error.message
    })
  }
}
