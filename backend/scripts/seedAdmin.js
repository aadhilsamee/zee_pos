const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
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
        console.log('MongoDB connected for seeding...');

        // Delete existing users with this email if any
        await User.deleteMany({ email: 'admin@gmail.com' });

        const adminUser = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: 'admin123',
        });

        await adminUser.save();
        console.log('Admin user created successfully!');
        console.log('Email: admin@gmail.com');
        console.log('Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    }
};

seedAdmin();
