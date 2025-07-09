const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['not started', 'in progress', 'completed'], default: 'not started' },
  deadline: { type: Date },
  // Enhanced deadline fields
  estimatedDuration: { type: Number }, // in days
  actualDuration: { type: Number }, // in days
  startDate: { type: Date },
  deadlineNotifications: [{
    type: { type: String, enum: ['7_days', '3_days', '1_day', 'overdue'], required: true },
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
  criticalPath: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  milestones: [{
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }]
}, { timestamps: true });

// Indexes for deadline queries
ProjectSchema.index({ deadline: 1, status: 1 });
ProjectSchema.index({ members: 1, deadline: 1 });

// Virtual for calculating overdue days
ProjectSchema.virtual('overdueDays').get(function () {
  if (!this.deadline || this.status === 'completed') return 0;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = now - deadline;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for checking if project is overdue
ProjectSchema.virtual('isOverdue').get(function () {
  if (!this.deadline || this.status === 'completed') return false;
  return new Date() > new Date(this.deadline);
});

// Method to request deadline extension
ProjectSchema.methods.requestExtension = function (userId, newDeadline, reason) {
  this.deadlineExtensions.push({
    requestedBy: userId,
    newDeadline: new Date(newDeadline),
    reason: reason
  });
  return this.save();
};

// Method to approve/reject deadline extension
ProjectSchema.methods.reviewExtension = function (extensionId, status, reviewerId) {
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

// Method to add milestone
ProjectSchema.methods.addMilestone = function (title, description, dueDate) {
  this.milestones.push({
    title,
    description,
    dueDate: new Date(dueDate)
  });
  return this.save();
};

// Method to complete milestone
ProjectSchema.methods.completeMilestone = function (milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.completed = true;
    milestone.completedAt = new Date();
  }
  return this.save();
};

// Pre-save middleware to update project status
ProjectSchema.pre('save', function (next) {
  // Add any pre-save logic here if needed
  next();
});

// Cascading delete: Remove all tasks when a project is deleted
ProjectSchema.pre('findOneAndDelete', async function (next) {
  try {
    const project = await this.model.findOne(this.getFilter());
    if (project) {
      await mongoose.model('Task').deleteMany({ projectId: project._id });
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Project', ProjectSchema); 