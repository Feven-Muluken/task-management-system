const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const initializeUserSchedules = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-management');
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      // Check if workSchedule exists and has the proper structure
      if (!user.workSchedule || !user.workSchedule.monday) {
        console.log(`Initializing workSchedule for user: ${user.name}`);

        // Set default work schedule
        user.workSchedule = {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '17:00', available: false },
          sunday: { start: '09:00', end: '17:00', available: false }
        };

        // Set default preferred working hours if not set
        if (!user.preferredWorkingHours) {
          user.preferredWorkingHours = {
            start: '09:00',
            end: '17:00'
          };
        }

        // Set default timezone if not set
        if (!user.timezone) {
          user.timezone = 'UTC';
        }

        // Set default maxHoursPerWeek if not set
        if (!user.maxHoursPerWeek) {
          user.maxHoursPerWeek = 40;
        }

        await user.save();
        console.log(`Updated workSchedule for user: ${user.name}`);
      }
    }

    console.log('User schedule initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing user schedules:', error);
    process.exit(1);
  }
};

initializeUserSchedules(); 