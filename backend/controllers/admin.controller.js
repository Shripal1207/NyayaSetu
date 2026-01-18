import User from '../models/User.model.js'

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
export const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalLawyers,
            verifiedLawyers,
            pendingVerifications,
            usersByType,
            recentUsers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ userType: 'lawyer' }),
            User.countDocuments({ userType: 'lawyer', verificationStatus: 'verified' }),
            User.countDocuments({ verificationStatus: 'pending' }),
            User.aggregate([
                { $group: { _id: '$userType', count: { $sum: 1 } } }
            ]),
            User.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email userType createdAt photoURL')
        ])

        res.status(200).json({
            totalUsers,
            totalLawyers,
            verifiedLawyers,
            pendingVerifications,
            usersByType: usersByType.reduce((acc, item) => {
                acc[item._id] = item.count
                return acc
            }, {}),
            recentUsers
        })

    } catch (error) {
        console.error('Get stats error:', error)
        res.status(500).json({ error: 'Failed to get statistics' })
    }
}

/**
 * Get all users with pagination and filters
 * GET /api/admin/users
 */
export const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            userType = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query

        const query = {}

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }

        if (userType) {
            query.userType = userType
        }

        const sortOptions = {}
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

        const [users, total] = await Promise.all([
            User.find(query)
                .sort(sortOptions)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .select('-__v'),
            User.countDocuments(query)
        ])

        res.status(200).json({
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Get users error:', error)
        res.status(500).json({ error: 'Failed to get users' })
    }
}

/**
 * Get single user details
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params

        const user = await User.findById(id).select('-__v')

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.status(200).json(user)

    } catch (error) {
        console.error('Get user by ID error:', error)
        res.status(500).json({ error: 'Failed to get user' })
    }
}

/**
 * Update user
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params
        const updates = req.body

        // Fields that can be updated by admin
        const allowedUpdates = [
            'name', 'email', 'phone', 'userType', 'verified',
            'verificationStatus', 'practiceAreas', 'yearsOfExperience',
            'consultationFees', 'qualification', 'location'
        ]

        const filteredUpdates = {}
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key]
            }
        })

        const user = await User.findByIdAndUpdate(
            id,
            { $set: filteredUpdates },
            { new: true, runValidators: true }
        ).select('-__v')

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.status(200).json({
            message: 'User updated successfully',
            user
        })

    } catch (error) {
        console.error('Update user error:', error)
        res.status(500).json({ error: 'Failed to update user' })
    }
}

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params

        const user = await User.findById(id)

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Prevent deleting admins
        if (user.userType === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin users' })
        }

        await User.findByIdAndDelete(id)

        res.status(200).json({
            message: 'User deleted successfully',
            deletedUser: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {
        console.error('Delete user error:', error)
        res.status(500).json({ error: 'Failed to delete user' })
    }
}

/**
 * Get all lawyers
 * GET /api/admin/lawyers
 */
export const getLawyers = async (req, res) => {
    try {
        const {
            verificationStatus = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query

        const query = { userType: 'lawyer' }

        if (verificationStatus) {
            query.verificationStatus = verificationStatus
        }

        const sortOptions = {}
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

        const lawyers = await User.find(query)
            .sort(sortOptions)
            .select('name email phone practiceAreas yearsOfExperience consultationFees verified verificationStatus barCouncilNumber barCouncilState rating location createdAt')

        res.status(200).json({
            count: lawyers.length,
            lawyers
        })

    } catch (error) {
        console.error('Get lawyers error:', error)
        res.status(500).json({ error: 'Failed to get lawyers' })
    }
}

/**
 * Get pending verifications for admin dashboard
 * GET /api/admin/verifications
 */
export const getPendingVerifications = async (req, res) => {
    try {
        const pending = await User.find({ verificationStatus: 'pending' })
            .sort({ verificationSubmittedAt: -1 })
            .select('name email phone barCouncilNumber barCouncilState barCouncilIdCardUrl verificationSubmittedAt createdAt photoURL')

        res.status(200).json({
            count: pending.length,
            verifications: pending
        })

    } catch (error) {
        console.error('Get pending verifications error:', error)
        res.status(500).json({ error: 'Failed to get pending verifications' })
    }
}

/**
 * Toggle user verification status (quick action)
 * PUT /api/admin/users/:id/toggle-verified
 */
export const toggleVerified = async (req, res) => {
    try {
        const { id } = req.params

        const user = await User.findById(id)

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        user.verified = !user.verified
        if (user.verified) {
            user.verificationStatus = 'verified'
        }
        await user.save()

        res.status(200).json({
            message: `User ${user.verified ? 'verified' : 'unverified'} successfully`,
            verified: user.verified
        })

    } catch (error) {
        console.error('Toggle verified error:', error)
        res.status(500).json({ error: 'Failed to toggle verification' })
    }
}
