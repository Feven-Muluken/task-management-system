const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const IssueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['bug', 'feature', 'blocker', 'enhancement', 'question'],
    default: 'bug'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  comments: [CommentSchema],
  resolution: { type: String },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  dueDate: { type: Date },
  tags: [{ type: String }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number
  }]
}, { timestamps: true });

// Indexes for better query performance
IssueSchema.index({ projectId: 1, status: 1 });
IssueSchema.index({ assignedTo: 1, status: 1 });
IssueSchema.index({ priority: 1, status: 1 });
IssueSchema.index({ category: 1, status: 1 });

// Virtual for calculating issue age
IssueSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if issue is overdue
IssueSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== 'closed';
});

// Method to add comment
IssueSchema.methods.addComment = function (userId, content) {
  this.comments.push({
    userId: userId,
    content: content
  });
  return this.save();
};

// Method to update status
IssueSchema.methods.updateStatus = function (newStatus, userId) {
  this.status = newStatus;
  if (newStatus === 'resolved' || newStatus === 'closed') {
    this.resolvedAt = new Date();
    this.resolvedBy = userId;
  }
  return this.save();
};

module.exports = mongoose.model('Issue', IssueSchema); 