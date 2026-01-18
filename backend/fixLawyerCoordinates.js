import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');

    // Update lawyer Nikhil's coordinates to Delhi
    const result = await mongoose.connection.collection('users').updateOne(
        { email: 'lawyer@gmail.com' },
        {
            $set: {
                coordinates: { type: 'Point', coordinates: [77.209, 28.6139] }, // [lng, lat]
                location: 'Delhi, India'
            }
        }
    );

    console.log('Updated coordinates for lawyer:', result.modifiedCount);

    await mongoose.disconnect();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
