import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.model.js'

dotenv.config()

/**
 * Seed test users for LegalNexus
 * - 1 Admin
 * - 3 Clients (regular users)
 * - 4 Lawyers (verified with Bar Council IDs)
 */

const testUsers = [
    // Admin
    {
        email: 'admin@legalnexus.com',
        password: 'Admin@123',
        name: 'Admin',
        userType: 'admin',
        verified: true,
        phone: '+91-9876543210',
        age: 35,
        gender: 'male',
        location: 'Mumbai, Maharashtra',
        coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] }
    },

    // Clients
    {
        email: 'rahul.sharma@gmail.com',
        password: 'User@123',
        name: 'Rahul Sharma',
        userType: 'user',
        phone: '+91-9123456789',
        age: 28,
        gender: 'male',
        location: 'Delhi, India',
        coordinates: { type: 'Point', coordinates: [77.2090, 28.6139] }
    },
    {
        email: 'priya.patel@gmail.com',
        password: 'User@123',
        name: 'Priya Patel',
        userType: 'user',
        phone: '+91-9234567890',
        age: 32,
        gender: 'female',
        location: 'Ahmedabad, Gujarat',
        coordinates: { type: 'Point', coordinates: [72.5714, 23.0225] }
    },
    {
        email: 'arun.kumar@gmail.com',
        password: 'User@123',
        name: 'Arun Kumar',
        userType: 'user',
        phone: '+91-9345678901',
        age: 45,
        gender: 'male',
        location: 'Chennai, Tamil Nadu',
        coordinates: { type: 'Point', coordinates: [80.2707, 13.0827] }
    },

    // Verified Lawyers
    {
        email: 'adv.meera.joshi@gmail.com',
        password: 'Lawyer@123',
        name: 'Adv. Meera Joshi',
        userType: 'lawyer',
        phone: '+91-9678901234',
        age: 42,
        gender: 'female',
        location: 'Mumbai, Maharashtra',
        coordinates: { type: 'Point', coordinates: [72.8777, 19.0760] },
        yearsOfExperience: 15,
        qualification: 'LLB, LLM (Constitutional Law)',
        practiceAreas: ['Constitutional Law', 'Civil Rights', 'Public Interest Litigation'],
        consultationFees: 3000,
        verified: true,
        verificationStatus: 'verified',
        barCouncilNumber: 'MH/12345/2009',
        barCouncilState: 'Maharashtra',
        rating: 4.8,
        verificationReviewedAt: new Date()
    },
    {
        email: 'adv.rajesh.gupta@gmail.com',
        password: 'Lawyer@123',
        name: 'Adv. Rajesh Gupta',
        userType: 'lawyer',
        phone: '+91-9789012345',
        age: 50,
        gender: 'male',
        location: 'Delhi, India',
        coordinates: { type: 'Point', coordinates: [77.2090, 28.6139] },
        yearsOfExperience: 22,
        qualification: 'LLB, LLM (Criminal Law), PhD',
        practiceAreas: ['Criminal Law', 'White Collar Crimes', 'Cyber Crime'],
        consultationFees: 5000,
        verified: true,
        verificationStatus: 'verified',
        barCouncilNumber: 'DL/08765/2002',
        barCouncilState: 'Delhi',
        rating: 4.9,
        verificationReviewedAt: new Date()
    },
    {
        email: 'adv.sunita.reddy@gmail.com',
        password: 'Lawyer@123',
        name: 'Adv. Sunita Reddy',
        userType: 'lawyer',
        phone: '+91-9890123456',
        age: 38,
        gender: 'female',
        location: 'Hyderabad, Telangana',
        coordinates: { type: 'Point', coordinates: [78.4867, 17.3850] },
        yearsOfExperience: 12,
        qualification: 'LLB, LLM (Family Law)',
        practiceAreas: ['Family Law', 'Divorce', 'Child Custody', 'Domestic Violence'],
        consultationFees: 2500,
        verified: true,
        verificationStatus: 'verified',
        barCouncilNumber: 'TS/54321/2012',
        barCouncilState: 'Telangana',
        rating: 4.7,
        verificationReviewedAt: new Date()
    },
    {
        email: 'adv.vikram.singh@gmail.com',
        password: 'Lawyer@123',
        name: 'Adv. Vikram Singh',
        userType: 'lawyer',
        phone: '+91-9901234567',
        age: 35,
        gender: 'male',
        location: 'Bangalore, Karnataka',
        coordinates: { type: 'Point', coordinates: [77.5946, 12.9716] },
        yearsOfExperience: 8,
        qualification: 'LLB, LLM (Corporate Law)',
        practiceAreas: ['Corporate Law', 'Startup Law', 'Intellectual Property', 'Contract Law'],
        consultationFees: 4000,
        verified: true,
        verificationStatus: 'verified',
        barCouncilNumber: 'KA/67890/2016',
        barCouncilState: 'Karnataka',
        rating: 4.6,
        verificationReviewedAt: new Date()
    }
]

const seedUsers = async () => {
    console.log('\n🔧 LegalNexus User Seeder')
    console.log('='.repeat(60))

    try {
        console.log('\n🔌 Connecting to MongoDB...')
        await mongoose.connect(process.env.MONGO_URI)
        console.log('✅ Connected to MongoDB')

        // Clear existing users (optional - comment out if you want to keep existing)
        console.log('\n🗑️  Clearing existing users...')
        await User.deleteMany({})
        console.log('✅ Cleared all users')

        // Create users
        console.log('\n📝 Creating users...')

        for (const userData of testUsers) {
            try {
                const user = await User.create(userData)
                const icon = userData.userType === 'admin' ? '👑' :
                    userData.userType === 'lawyer' ? '⚖️' : '👤'
                console.log(`${icon} Created: ${user.name} (${user.email})`)
            } catch (err) {
                console.log(`❌ Failed to create ${userData.email}: ${err.message}`)
            }
        }

        // Summary
        const admins = await User.countDocuments({ userType: 'admin' })
        const clients = await User.countDocuments({ userType: 'user' })
        const lawyers = await User.countDocuments({ userType: 'lawyer' })

        console.log('\n' + '='.repeat(60))
        console.log('🎉 SEEDING COMPLETE!')
        console.log('='.repeat(60))
        console.log(`\n📊 Summary:`)
        console.log(`   👑 Admins:  ${admins}`)
        console.log(`   👤 Clients: ${clients}`)
        console.log(`   ⚖️  Lawyers: ${lawyers}`)

        console.log('\n📋 Credentials:')
        console.log('='.repeat(60))
        console.log('\n👑 ADMIN:')
        console.log('   Email:    admin@legalnexus.com')
        console.log('   Password: Admin@123')

        console.log('\n👤 CLIENTS (Password for all: User@123):')
        console.log('   • rahul.sharma@gmail.com')
        console.log('   • priya.patel@gmail.com')
        console.log('   • arun.kumar@gmail.com')

        console.log('\n⚖️  LAWYERS (Password for all: Lawyer@123):')
        console.log('   • adv.meera.joshi@gmail.com     | MH/12345/2009 | Constitutional Law')
        console.log('   • adv.rajesh.gupta@gmail.com    | DL/08765/2002 | Criminal Law')
        console.log('   • adv.sunita.reddy@gmail.com    | TS/54321/2012 | Family Law')
        console.log('   • adv.vikram.singh@gmail.com    | KA/67890/2016 | Corporate Law')

        console.log('\n💡 All lawyers are pre-verified with Bar Council IDs.')
        console.log('   You can add ID card images later via admin dashboard.\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Disconnected from MongoDB\n')
    }
}

seedUsers()
