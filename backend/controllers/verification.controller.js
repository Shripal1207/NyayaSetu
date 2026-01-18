import User from '../models/User.model.js'
import { uploadImage, deleteImage } from '../utils/cloudinary.js'

// Indian State Bar Council codes
const STATE_BAR_COUNCILS = {
    'AP': 'Andhra Pradesh',
    'AR': 'Arunachal Pradesh',
    'AS': 'Assam',
    'BR': 'Bihar',
    'CG': 'Chhattisgarh',
    'DL': 'Delhi',
    'GA': 'Goa',
    'GJ': 'Gujarat',
    'HR': 'Haryana',
    'HP': 'Himachal Pradesh',
    'JH': 'Jharkhand',
    'KA': 'Karnataka',
    'KL': 'Kerala',
    'MP': 'Madhya Pradesh',
    'MH': 'Maharashtra',
    'MN': 'Manipur',
    'ML': 'Meghalaya',
    'MZ': 'Mizoram',
    'NL': 'Nagaland',
    'OD': 'Odisha',
    'PB': 'Punjab',
    'RJ': 'Rajasthan',
    'SK': 'Sikkim',
    'TN': 'Tamil Nadu',
    'TS': 'Telangana',
    'TR': 'Tripura',
    'UP': 'Uttar Pradesh',
    'UK': 'Uttarakhand',
    'WB': 'West Bengal',
    'BCI': 'Bar Council of India'
}

// Validate Bar Council Number format: XX/XXXXX/YYYY
const validateBarCouncilNumber = (number) => {
    const regex = /^[A-Z]{2,3}\/\d{4,6}\/\d{4}$/
    return regex.test(number)
}

/**
 * Submit verification request
 * POST /api/verification/submit
 */
export const submitVerification = async (req, res) => {
    try {
        const { barCouncilNumber, barCouncilState, idCardImage } = req.body
        const userId = req.user?.uid || req.body.userId

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        // Validate Bar Council Number format
        if (!validateBarCouncilNumber(barCouncilNumber)) {
            return res.status(400).json({
                error: 'Invalid Bar Council Number format. Expected: XX/XXXXX/YYYY (e.g., AP/03207/2015)'
            })
        }

        // Validate state code
        const stateCode = barCouncilNumber.split('/')[0]
        if (!STATE_BAR_COUNCILS[stateCode]) {
            return res.status(400).json({
                error: 'Invalid state code in Bar Council Number',
                validCodes: Object.keys(STATE_BAR_COUNCILS)
            })
        }

        // Find user by MongoDB _id
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Check if already verified
        if (user.verificationStatus === 'verified') {
            return res.status(400).json({ error: 'You are already verified' })
        }

        // Check if verification is pending
        if (user.verificationStatus === 'pending') {
            return res.status(400).json({ error: 'Verification already pending approval' })
        }

        // Upload ID card to Cloudinary
        if (!idCardImage) {
            return res.status(400).json({ error: 'ID card image is required' })
        }

        const uploadResult = await uploadImage(idCardImage, {
            folder: `legalnexus/verification/${userId}`
        })

        if (!uploadResult.success) {
            return res.status(500).json({ error: 'Failed to upload ID card image' })
        }

        // Update user with verification details
        user.userType = 'lawyer'
        user.barCouncilNumber = barCouncilNumber
        user.barCouncilState = STATE_BAR_COUNCILS[stateCode]
        user.barCouncilIdCardUrl = uploadResult.url
        user.barCouncilIdCardPublicId = uploadResult.publicId
        user.verificationStatus = 'verified' // Auto-verify
        user.verified = true // Auto-verify
        user.verificationSubmittedAt = new Date()
        user.verificationReviewedAt = new Date() // Auto-approved

        await user.save()

        res.status(200).json({
            message: 'Verification approved instantly',
            status: 'verified',
            barCouncilNumber: user.barCouncilNumber,
            state: user.barCouncilState
        })

    } catch (error) {
        console.error('Submit verification error:', error)
        res.status(500).json({ error: 'Failed to submit verification' })
    }
}

/**
 * Get verification status
 * GET /api/verification/status/:userId
 */
export const getVerificationStatus = async (req, res) => {
    try {
        const { userId } = req.params

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.status(200).json({
            verificationStatus: user.verificationStatus,
            barCouncilNumber: user.barCouncilNumber,
            barCouncilState: user.barCouncilState,
            submittedAt: user.verificationSubmittedAt,
            reviewedAt: user.verificationReviewedAt,
            rejectionReason: user.verificationRejectionReason
        })

    } catch (error) {
        console.error('Get verification status error:', error)
        res.status(500).json({ error: 'Failed to get verification status' })
    }
}

/**
 * Get all pending verifications (Admin only)
 * GET /api/verification/pending
 */
export const getPendingVerifications = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            verificationStatus: 'pending'
        }).select(
            'name email phone barCouncilNumber barCouncilState barCouncilIdCardUrl verificationSubmittedAt createdAt'
        ).sort({ verificationSubmittedAt: -1 })

        res.status(200).json({
            count: pendingUsers.length,
            verifications: pendingUsers
        })

    } catch (error) {
        console.error('Get pending verifications error:', error)
        res.status(500).json({ error: 'Failed to get pending verifications' })
    }
}

/**
 * Approve verification (Admin only)
 * PUT /api/verification/:id/approve
 */
export const approveVerification = async (req, res) => {
    try {
        const { id } = req.params
        const adminId = req.user?.uid || req.body.adminId

        const user = await User.findById(id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        if (user.verificationStatus !== 'pending') {
            return res.status(400).json({ error: 'Verification is not pending' })
        }

        // Find admin user by MongoDB _id
        const admin = await User.findById(adminId)

        user.verificationStatus = 'verified'
        user.verified = true
        user.verificationReviewedAt = new Date()
        if (admin) {
            user.verificationReviewedBy = admin._id
        }

        await user.save()

        res.status(200).json({
            message: 'Verification approved successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                verificationStatus: user.verificationStatus
            }
        })

    } catch (error) {
        console.error('Approve verification error:', error)
        res.status(500).json({ error: 'Failed to approve verification' })
    }
}

/**
 * Reject verification (Admin only)
 * PUT /api/verification/:id/reject
 */
export const rejectVerification = async (req, res) => {
    try {
        const { id } = req.params
        const { reason } = req.body
        const adminId = req.user?.uid || req.body.adminId

        if (!reason) {
            return res.status(400).json({ error: 'Rejection reason is required' })
        }

        const user = await User.findById(id)
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        if (user.verificationStatus !== 'pending') {
            return res.status(400).json({ error: 'Verification is not pending' })
        }

        // Delete the uploaded ID card
        if (user.barCouncilIdCardPublicId) {
            await deleteImage(user.barCouncilIdCardPublicId)
        }

        // Find admin user by MongoDB _id
        const admin = await User.findById(adminId)

        user.verificationStatus = 'rejected'
        user.verificationRejectionReason = reason
        user.verificationReviewedAt = new Date()
        user.barCouncilIdCardUrl = null
        user.barCouncilIdCardPublicId = null
        if (admin) {
            user.verificationReviewedBy = admin._id
        }

        await user.save()

        res.status(200).json({
            message: 'Verification rejected',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                verificationStatus: user.verificationStatus,
                rejectionReason: reason
            }
        })

    } catch (error) {
        console.error('Reject verification error:', error)
        res.status(500).json({ error: 'Failed to reject verification' })
    }
}

/**
 * Get State Bar Council codes
 * GET /api/verification/states
 */
export const getStateBarCouncils = async (req, res) => {
    res.status(200).json(STATE_BAR_COUNCILS)
}
