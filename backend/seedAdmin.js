import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.model.js'

dotenv.config()

// Admin credentials
const ADMIN_EMAIL = 'admin@legalnexus.com'
const ADMIN_PASSWORD = 'Admin@123'
const ADMIN_NAME = 'Admin'

/**
 * Seed admin user with JWT authentication
 */
const seedAdmin = async () => {
    console.log('\n🔧 LegalNexus Admin Seeder (JWT Auth)')
    console.log('='.repeat(50))

    try {
        // Connect to MongoDB
        console.log('\n🔌 Connecting to MongoDB...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connected to MongoDB')

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() })

        if (existingAdmin) {
            console.log('\n✅ Admin user already exists!')
            console.log('='.repeat(50))
            console.log('📧 Email:    ' + ADMIN_EMAIL)
            console.log('🔑 Password: ' + ADMIN_PASSWORD)
            console.log('👑 Role:     ' + existingAdmin.userType)
            console.log('🆔 ID:       ' + existingAdmin._id)
            console.log('='.repeat(50))
            return
        }

        // Create admin user (password will be hashed automatically by pre-save hook)
        console.log('\n📝 Creating admin user...')

        const admin = await User.create({
            email: ADMIN_EMAIL.toLowerCase(),
            password: ADMIN_PASSWORD,
            name: ADMIN_NAME,
            userType: 'admin',
            verified: true,
            phone: '+91-9876543210',
            age: 35,
            gender: 'male',
            location: 'Mumbai, Maharashtra',
            coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] }
        })

        console.log('✅ Admin user created!')

        // Success message
        console.log('\n' + '='.repeat(50))
        console.log('🎉 ADMIN USER CREATED SUCCESSFULLY!')
        console.log('='.repeat(50))
        console.log('\n📧 Email:    ' + ADMIN_EMAIL)
        console.log('🔑 Password: ' + ADMIN_PASSWORD)
        console.log('👑 Role:     admin')
        console.log('🆔 ID:       ' + admin._id)
        console.log('\n💡 You can now login at: http://localhost:5123/auth')
        console.log('   After login, you\'ll see the Admin Dashboard in the sidebar.\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB\n')
    }
}

seedAdmin()
