import User from '../models/User.model.js'

/**
 * Admin middleware - checks if user is an admin
 */
export const isAdmin = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'] || req.body.userId

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' })
        }

        // Find user by MongoDB _id
        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        if (user.userType !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' })
        }

        req.adminUser = user
        next()
    } catch (error) {
        console.error('Admin middleware error:', error)
        res.status(500).json({ error: 'Authentication failed' })
    }
}

export default isAdmin

