const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../../.env') }); // Look for .env in the root project folder

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('Error: MONGODB_URI not found in .env');
            process.exit(1);
        }

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected for reset...');

        const collections = ['products', 'customers', 'transactions', 'debts', 'storeproducts'];

        // If you want to delete users as well, add 'users' to the array above.
        // For now, we keep users so you don't lose your login.

        for (const collectionName of collections) {
            try {
                await mongoose.connection.collection(collectionName).deleteMany({});
                console.log(`Cleared collection: ${collectionName}`);
            } catch (err) {
                if (err.code === 26) {
                    console.log(`Collection ${collectionName} does not exist, skipping...`);
                } else {
                    console.error(`Error clearing ${collectionName}:`, err.message);
                }
            }
        }

        console.log('Database reset complete! The system is now fresh.');
        process.exit(0);
    } catch (error) {
        console.error('Reset failed:', error.message);
        process.exit(1);
    }
};

connectDB();
