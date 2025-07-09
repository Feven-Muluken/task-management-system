const Issue = require('../models/Issue');
const Notification = require('../models/Notification');

// Create a new issue
exports.createIssue = async (req, res) => {
  try {
    const issue = new Issue({
      ...req.body,
      reportedBy: req.body.reportedBy || 'USER_ID_HERE' // TODO: Get from auth
    });
    await issue.save();

    // Create notification for assigned user
    if (issue.assignedTo) {
      await Notification.create({
        userId: issue.assignedTo,
        message: `You have been assigned a new ${issue.category}: ${issue.title}`
      });
    }

    // Populate user references
    await issue.populate(['assignedTo', 'reportedBy', 'resolvedBy']);

    res.status(201).json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all issues with filtering
exports.getIssues = async (req, res) => {
  try {
    const {
      projectId,
      status,
      priority,
      category,
      assignedTo,
      reportedBy,
      search
    } = req.query;

    const filter = {};

    // Apply filters
    if (projectId) filter.projectId = projectId;
    if (status && status !== 'all') filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (reportedBy) filter.reportedBy = reportedBy;

    // Text search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const issues = await Issue.find(filter)
      .populate('assignedTo', 'name email')
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('projectId', 'name')
      .populate('taskId', 'title')
      .populate('comments.userId', 'name')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single issue by ID
exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .populate('projectId', 'name')
      .populate('taskId', 'title')
      .populate('comments.userId', 'name');

    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an issue
exports.updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    // Check if assignment changed
    const wasAssigned = issue.assignedTo;
    const newAssignment = req.body.assignedTo;

    // Update the issue
    Object.assign(issue, req.body);
    await issue.save();

    // Create notification for new assignment
    if (newAssignment && newAssignment !== wasAssigned) {
      await Notification.create({
        userId: newAssignment,
        message: `You have been assigned a ${issue.category}: ${issue.title}`
      });
    }

    // Populate references
    await issue.populate(['assignedTo', 'reportedBy', 'resolvedBy', 'comments.userId']);

    res.json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete an issue
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add comment to issue
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.body.userId || 'USER_ID_HERE'; // TODO: Get from auth

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    await issue.addComment(userId, content);

    // Create notification for issue assignee (if different from commenter)
    if (issue.assignedTo && issue.assignedTo.toString() !== userId) {
      await Notification.create({
        userId: issue.assignedTo,
        message: `New comment on ${issue.category}: ${issue.title}`
      });
    }

    // Populate the new comment
    await issue.populate('comments.userId', 'name');

    res.json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update issue status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.body.userId || 'USER_ID_HERE'; // TODO: Get from auth

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    await issue.updateStatus(status, userId);

    // Create notification for status change
    if (issue.assignedTo) {
      await Notification.create({
        userId: issue.assignedTo,
        message: `Status updated for ${issue.category}: ${issue.title} - ${status}`
      });
    }

    await issue.populate(['assignedTo', 'reportedBy', 'resolvedBy']);
    res.json(issue);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get issue statistics
exports.getIssueStats = async (req, res) => {
  try {
    const { projectId } = req.query;
    const filter = projectId ? { projectId } : {};

    const stats = await Issue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          bugs: { $sum: { $cond: [{ $eq: ['$category', 'bug'] }, 1, 0] } },
          features: { $sum: { $cond: [{ $eq: ['$category', 'feature'] }, 1, 0] } }
        }
      }
    ]);

    res.json(stats[0] || {
      total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
      critical: 0, high: 0, bugs: 0, features: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 