const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path as needed
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to MongoDB');

        const email = 'admin@gmail.com';
        const newPassword = 'admin123';

        try {
            const user = await User.findOne({ email });
            if (!user) {
                console.log('User not found. Creating new admin user...');
                const newUser = new User({
                    name: 'Admin',
                    email,
                    password: newPassword
                });
                await newUser.save();
                console.log('Admin user created with password:', newPassword);
            } else {
                console.log(`User found: ${user.email}`);
                user.password = newPassword; // Mongoose middleware will hash this
                await user.save();
                console.log('Password updated successfully to:', newPassword);
            }
        } catch (err) {
            console.error('Error updating password:', err);
        } finally {
            await mongoose.disconnect();
            console.log('Disconnected');
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
