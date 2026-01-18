import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');

    // Update all users with verificationStatus 'pending' to 'unverified'
    const result = await mongoose.connection.collection('users').updateMany(
        { verificationStatus: 'pending' },
        {
            $set: {
                verificationStatus: 'unverified',
                verified: false,
                barCouncilIdCardUrl: null,
                barCouncilIdCardPublicId: null
            }
        }
    );

    console.log('Updated', result.modifiedCount, 'users from pending to unverified');

    await mongoose.disconnect();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
