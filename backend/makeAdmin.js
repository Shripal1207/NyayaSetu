import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.model.js'

dotenv.config()

/**
 * Script to make an existing user an admin
 * Usage: node makeAdmin.js <email>
 * 
 * Example: node makeAdmin.js myemail@gmail.com
 */

const makeAdmin = async () => {
    const email = process.argv[2]

    if (!email) {
        console.log('\n❌ Please provide an email address')
        console.log('   Usage: node makeAdmin.js <email>')
        console.log('   Example: node makeAdmin.js admin@example.com\n')
        process.exit(1)
    }

    try {
        console.log('\n🔌 Connecting to MongoDB...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connected to MongoDB')

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() })

        if (!user) {
            console.log(`\n❌ User with email "${email}" not found!`)
            console.log('\n💡 Please first sign up with this email through the app, then run this script.\n')
            process.exit(1)
        }

        if (user.userType === 'admin') {
            console.log(`\n✅ User "${user.name}" is already an admin!\n`)
            console.log('📧 Email:', user.email)
            console.log('🔥 Firebase ID:', user.firebaseId)
            process.exit(0)
        }

        // Update user to admin
        user.userType = 'admin'
        user.verified = true
        await user.save()

        console.log('\n✅ Successfully made user an admin!')
        console.log('='.repeat(50))
        console.log('👤 Name:', user.name)
        console.log('📧 Email:', user.email)
        console.log('👑 Role: admin')
        console.log('🔥 Firebase ID:', user.firebaseId)
        console.log('='.repeat(50))
        console.log('\n🎉 You can now login with this email to access the admin dashboard!\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB')
    }
}

makeAdmin()
