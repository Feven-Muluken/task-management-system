const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager', 'member'], default: 'member' },
  department: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
  // Work schedule fields
  workSchedule: {
    monday: { start: String, end: String, available: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
    thursday: { start: String, end: String, available: { type: Boolean, default: true } },
    friday: { start: String, end: String, available: { type: Boolean, default: true } },
    saturday: { start: String, end: String, available: { type: Boolean, default: false } },
    sunday: { start: String, end: String, available: { type: Boolean, default: false } }
  },
  timezone: { type: String, default: 'UTC' },
  maxHoursPerWeek: { type: Number, default: 40 },
  currentWorkload: { type: Number, default: 0 }, // hours per week
  vacationDays: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],
  overtimeHours: { type: Number, default: 0 },
  preferredWorkingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  }
}, { timestamps: true });

// Add index for soft deletion queries
UserSchema.index({ isActive: 1, deletedAt: 1 });

module.exports = mongoose.model('User', UserSchema); 