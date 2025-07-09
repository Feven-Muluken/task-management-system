const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-management');
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log('No users found. Creating a test user...');

      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123', // In production, this should be hashed
        role: 'admin',
        isActive: true,
        workSchedule: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '17:00', available: false },
          sunday: { start: '09:00', end: '17:00', available: false }
        },
        timezone: 'UTC',
        maxHoursPerWeek: 40,
        currentWorkload: 0,
        preferredWorkingHours: {
          start: '09:00',
          end: '17:00'
        }
      });

      await testUser.save();
      console.log('Test user created successfully:', testUser._id);
    } else {
      console.log('Users found:');
      users.forEach(user => {
        console.log(`- ${user.name} (${user._id}) - Role: ${user.role}`);

        // Check if user has workSchedule
        if (!user.workSchedule || !user.workSchedule.monday) {
          console.log(`  ⚠️ User ${user.name} is missing workSchedule`);
        } else {
          console.log(`  ✅ User ${user.name} has workSchedule`);
        }
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error checking users:', error);
    mongoose.connection.close();
  }
};

checkUsers(); 