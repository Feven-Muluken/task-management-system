const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deadline: { type: Date },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  issue: { type: Boolean, default: false },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  // Enhanced deadline fields
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  deadlineNotifications: [{
    type: { type: String, enum: ['3_days', '1_day', 'overdue'], required: true },
    sentAt: { type: Date, default: Date.now },
    sentTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  deadlineExtensions: [{
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedAt: { type: Date, default: Date.now },
    newDeadline: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  }],
}, { timestamps: true });

// Indexes for deadline queries
TaskSchema.index({ deadline: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, deadline: 1 });
TaskSchema.index({ projectId: 1, deadline: 1 });

// Virtual for calculating overdue days
TaskSchema.virtual('overdueDays').get(function () {
  if (!this.deadline || this.status === 'done') return 0;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = now - deadline;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for checking if task is overdue
TaskSchema.virtual('isOverdue').get(function () {
  if (!this.deadline || this.status === 'done') return false;
  return new Date() > new Date(this.deadline);
});

// Method to request deadline extension
TaskSchema.methods.requestExtension = function (userId, newDeadline, reason) {
  this.deadlineExtensions.push({
    requestedBy: userId,
    newDeadline: new Date(newDeadline),
    reason: reason
  });
  return this.save();
};

// Method to approve/reject deadline extension
TaskSchema.methods.reviewExtension = function (extensionId, status, reviewerId) {
  const extension = this.deadlineExtensions.id(extensionId);
  if (extension) {
    extension.status = status;
    extension.reviewedBy = reviewerId;
    extension.reviewedAt = new Date();

    if (status === 'approved') {
      this.deadline = extension.newDeadline;
    }
  }
  return this.save();
};

// Delete notifications when a task is deleted
TaskSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Notification = require('./Notification');
    await Notification.deleteMany({
      $or: [
        { 'relatedItem.type': 'task', 'relatedItem.id': doc._id },
        { 'relatedItem.taskId': doc._id } // fallback if you use taskId elsewhere
      ]
    });
  }
});

module.exports = mongoose.model('Task', TaskSchema); 