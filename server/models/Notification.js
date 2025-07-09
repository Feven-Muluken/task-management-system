const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['task_assignment', 'deadline_approaching', 'deadline_overdue', 'vacation_request', 'vacation_response', 'issue_update', 'general'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  read: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
  relatedItem: {
    type: { type: String, enum: ['task', 'project', 'issue', 'user'] },
    id: { type: mongoose.Schema.Types.ObjectId },
    title: String,
    projectName: String,
    status: String,
    employeeName: String,
    startDate: Date,
    endDate: Date,
    approved: Boolean
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for better query performance
NotificationSchema.index({ userId: 1, read: 1, timestamp: -1 });
NotificationSchema.index({ type: 1, priority: 1 });

module.exports = mongoose.model('Notification', NotificationSchema); 