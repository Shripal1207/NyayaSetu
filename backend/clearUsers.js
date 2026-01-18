import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.model.js'

dotenv.config()

async function clearAllUsers() {
    try {
        console.log('🔌 Connecting to MongoDB...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connected to MongoDB')

        // Count existing users
        const count = await User.countDocuments()
        console.log(`📊 Found ${count} users in database`)

        // Delete all users
        console.log('🧹 Deleting ALL users...')
        const result = await User.deleteMany({})
        console.log(`✅ Deleted ${result.deletedCount} users`)

        console.log('\n✨ Database cleared successfully!')
        console.log('You can now create fresh users through the app.')

    } catch (error) {
        console.error('❌ Error clearing database:', error)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB')
    }
}

clearAllUsers()
