const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Get all overdue tasks and projects
const getOverdueItems = async (req, res) => {
  try {
    const { userId } = req.query;

    const overdueTasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { projectId: { $in: await Project.find({ members: userId }).distinct('_id') } }
      ],
      deadline: { $lt: new Date() },
      status: { $ne: 'done' }
    }).populate('assignedTo', 'name email').populate('projectId', 'name');

    const overdueProjects = await Project.find({
      members: userId,
      deadline: { $lt: new Date() },
      status: { $ne: 'completed' }
    }).populate('members', 'name email');

    res.json({
      overdueTasks,
      overdueProjects,
      totalOverdue: overdueTasks.length + overdueProjects.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming deadlines (next 7 days)
const getUpcomingDeadlines = async (req, res) => {
  try {
    const { userId, days = 7 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const upcomingTasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { projectId: { $in: await Project.find({ members: userId }).distinct('_id') } }
      ],
      deadline: { $gte: new Date(), $lte: futureDate },
      status: { $ne: 'done' }
    }).populate('assignedTo', 'name email').populate('projectId', 'name');

    const upcomingProjects = await Project.find({
      members: userId,
      deadline: { $gte: new Date(), $lte: futureDate },
      status: { $ne: 'completed' }
    }).populate('members', 'name email');

    res.json({
      upcomingTasks,
      upcomingProjects,
      totalUpcoming: upcomingTasks.length + upcomingProjects.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Request deadline extension for task
const requestTaskExtension = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newDeadline, reason } = req.body;
    const userId = req.body.userId || 'USER_ID_HERE'; // TODO: Get from auth

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.requestExtension(userId, newDeadline, reason);

    // Create notification for project manager/admin
    const project = await Project.findById(task.projectId);
    if (project && project.members.length > 0) {
      const adminUser = project.members[0]; // Assuming first member is admin
      await Notification.create({
        userId: adminUser,
        title: 'Deadline Extension Request',
        message: `Task "${task.title}" extension requested by ${userId}`,
        type: 'deadline_extension',
        relatedItem: { type: 'task', id: taskId },
        priority: 'medium'
      });
    }

    res.json({ message: 'Extension request submitted successfully', task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Request deadline extension for project
const requestProjectExtension = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { newDeadline, reason } = req.body;
    const userId = req.body.userId || 'USER_ID_HERE'; // TODO: Get from auth

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.requestExtension(userId, newDeadline, reason);

    // Create notification for all project members
    for (const memberId of project.members) {
      if (memberId.toString() !== userId) {
        await Notification.create({
          userId: memberId,
          title: 'Project Deadline Extension Request',
          message: `Project "${project.name}" extension requested by ${userId}`,
          type: 'deadline_extension',
          relatedItem: { type: 'project', id: projectId },
          priority: 'high'
        });
      }
    }

    res.json({ message: 'Extension request submitted successfully', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Review deadline extension request
const reviewExtension = async (req, res) => {
  try {
    const { itemId, itemType } = req.params;
    const { extensionId, status, reason } = req.body;
    const reviewerId = req.body.reviewerId || 'USER_ID_HERE'; // TODO: Get from auth

    let item;
    if (itemType === 'task') {
      item = await Task.findById(itemId);
    } else if (itemType === 'project') {
      item = await Project.findById(itemId);
    } else {
      return res.status(400).json({ error: 'Invalid item type' });
    }

    if (!item) {
      return res.status(404).json({ error: `${itemType} not found` });
    }

    await item.reviewExtension(extensionId, status, reviewerId);

    // Create notification for requester
    const extension = item.deadlineExtensions.id(extensionId);
    if (extension) {
      await Notification.create({
        userId: extension.requestedBy,
        title: `Deadline Extension ${status}`,
        message: `Your deadline extension request for ${itemType} "${item.name || item.title}" was ${status}`,
        type: 'deadline_extension_review',
        relatedItem: { type: itemType, id: itemId },
        priority: status === 'approved' ? 'low' : 'medium'
      });
    }

    res.json({ message: `Extension ${status} successfully`, item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get deadline statistics
const getDeadlineStats = async (req, res) => {
  try {
    const { userId } = req.query;

    // Task statistics
    let taskFilter = {};
    let projectFilter = {};
    if (userId) {
      taskFilter = {
        $or: [
          { assignedTo: userId },
          { projectId: { $in: await Project.find({ members: userId }).distinct('_id') } }
        ]
      };
      projectFilter = { members: userId };
    }
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const totalTasks = await Task.countDocuments(taskFilter);
    const overdueTasks = await Task.countDocuments({
      ...taskFilter,
      deadline: { $lt: now },
      status: { $ne: 'done' }
    });
    const upcomingTasks = await Task.countDocuments({
      ...taskFilter,
      deadline: { $gte: now, $lte: nextWeek },
      status: { $ne: 'done' }
    });

    // Project statistics
    const totalProjects = await Project.countDocuments(projectFilter);
    const overdueProjects = await Project.countDocuments({
      ...projectFilter,
      deadline: { $lt: now },
      status: { $ne: 'completed' }
    });
    const upcomingProjects = await Project.countDocuments({
      ...projectFilter,
      deadline: { $gte: now, $lte: nextWeek },
      status: { $ne: 'completed' }
    });

    res.json({
      tasks: {
        total: totalTasks,
        overdue: overdueTasks,
        upcoming: upcomingTasks,
        onTime: totalTasks - overdueTasks
      },
      projects: {
        total: totalProjects,
        overdue: overdueProjects,
        upcoming: upcomingProjects,
        onTime: totalProjects - overdueProjects
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get calendar view data
const getCalendarData = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const tasks = await Task.find({
      $or: [
        { assignedTo: userId },
        { projectId: { $in: await Project.find({ members: userId }).distinct('_id') } }
      ],
      deadline: { $gte: start, $lte: end }
    }).populate('assignedTo', 'name').populate('projectId', 'name');

    const projects = await Project.find({
      members: userId,
      deadline: { $gte: start, $lte: end }
    }).populate('members', 'name');

    const milestones = [];
    for (const project of projects) {
      for (const milestone of project.milestones) {
        if (milestone.dueDate >= start && milestone.dueDate <= end) {
          milestones.push({
            id: milestone._id,
            title: milestone.title,
            date: milestone.dueDate,
            type: 'milestone',
            projectId: project._id,
            projectName: project.name,
            completed: milestone.completed
          });
        }
      }
    }

    res.json({
      tasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        date: task.deadline,
        type: 'task',
        status: task.status,
        isOverdue: task.isOverdue,
        assignedTo: task.assignedTo?.name,
        projectName: task.projectId?.name
      })),
      projects: projects.map(project => ({
        id: project._id,
        title: project.name,
        date: project.deadline,
        type: 'project',
        status: project.status,
        isOverdue: project.isOverdue
      })),
      milestones
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add milestone to project
const addMilestone = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, dueDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.addMilestone(title, description, dueDate);

    // Create notification for project members
    for (const memberId of project.members) {
      await Notification.create({
        userId: memberId,
        title: 'New Milestone Added',
        message: `New milestone "${title}" added to project "${project.name}"`,
        type: 'milestone',
        relatedItem: { type: 'project', id: projectId },
        priority: 'medium'
      });
    }

    res.json({ message: 'Milestone added successfully', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Complete milestone
const completeMilestone = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.completeMilestone(milestoneId);

    // Create notification for project members
    const milestone = project.milestones.id(milestoneId);
    if (milestone) {
      for (const memberId of project.members) {
        await Notification.create({
          userId: memberId,
          title: 'Milestone Completed',
          message: `Milestone "${milestone.title}" completed in project "${project.name}"`,
          type: 'milestone_complete',
          relatedItem: { type: 'project', id: projectId },
          priority: 'low'
        });
      }
    }

    res.json({ message: 'Milestone completed successfully', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send deadline notifications (to be called by cron job)
const sendDeadlineNotifications = async () => {
  const startTime = Date.now();
  let notificationsSent = 0;
  let errors = [];

  try {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log(`📧 Starting deadline notifications at ${now.toISOString()}`);

    // Check for overdue tasks
    const overdueTasks = await Task.find({
      deadline: { $lt: now },
      status: { $ne: 'done' }
    }).populate('assignedTo').populate('projectId');

    console.log(`📋 Found ${overdueTasks.length} overdue tasks`);

    for (const task of overdueTasks) {
      try {
        if (task.assignedTo) {
          const notificationSent = task.deadlineNotifications.some(n =>
            n.type === 'overdue' && n.sentTo.toString() === task.assignedTo._id.toString()
          );

          if (!notificationSent) {
            const overdueDays = Math.ceil((now - task.deadline) / (1000 * 60 * 60 * 24));

            await Notification.create({
              userId: task.assignedTo._id,
              title: 'Task Overdue',
              message: `Task "${task.title}" is overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`,
              type: 'deadline_overdue',
              relatedItem: { type: 'task', id: task._id },
              priority: 'high'
            });

            task.deadlineNotifications.push({
              type: 'overdue',
              sentTo: task.assignedTo._id,
              sentAt: new Date()
            });
            await task.save();
            notificationsSent++;
          }
        }
      } catch (taskError) {
        errors.push(`Task ${task._id}: ${taskError.message}`);
      }
    }

    // Check for upcoming deadlines (1 day, 3 days, 7 days)
    const upcomingTasks = await Task.find({
      deadline: { $gte: now, $lte: sevenDays },
      status: { $ne: 'done' }
    }).populate('assignedTo').populate('projectId');

    console.log(`📋 Found ${upcomingTasks.length} upcoming tasks`);

    for (const task of upcomingTasks) {
      try {
        if (task.assignedTo) {
          const daysUntilDeadline = Math.ceil((task.deadline - now) / (1000 * 60 * 60 * 24));

          let notificationType = null;
          if (daysUntilDeadline === 1) notificationType = '1_day';
          else if (daysUntilDeadline === 3) notificationType = '3_days';
          else if (daysUntilDeadline === 7) notificationType = '7_days';

          if (notificationType) {
            const notificationSent = task.deadlineNotifications.some(n =>
              n.type === notificationType && n.sentTo.toString() === task.assignedTo._id.toString()
            );

            if (!notificationSent) {
              await Notification.create({
                userId: task.assignedTo._id,
                title: 'Deadline Approaching',
                message: `Task "${task.title}" is due in ${daysUntilDeadline} day${daysUntilDeadline > 1 ? 's' : ''}`,
                type: 'deadline_approaching',
                relatedItem: { type: 'task', id: task._id },
                priority: daysUntilDeadline === 1 ? 'high' : 'medium'
              });

              task.deadlineNotifications.push({
                type: notificationType,
                sentTo: task.assignedTo._id,
                sentAt: new Date()
              });
              await task.save();
              notificationsSent++;
            }
          }
        }
      } catch (taskError) {
        errors.push(`Task ${task._id}: ${taskError.message}`);
      }
    }

    // Check for overdue projects
    const overdueProjects = await Project.find({
      deadline: { $lt: now },
      status: { $ne: 'completed' }
    }).populate('members');

    console.log(`📋 Found ${overdueProjects.length} overdue projects`);

    for (const project of overdueProjects) {
      try {
        for (const member of project.members) {
          const notificationSent = project.deadlineNotifications.some(n =>
            n.type === 'overdue' && n.sentTo.toString() === member._id.toString()
          );

          if (!notificationSent) {
            const overdueDays = Math.ceil((now - project.deadline) / (1000 * 60 * 60 * 24));

            await Notification.create({
              userId: member._id,
              title: 'Project Overdue',
              message: `Project "${project.name}" is overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`,
              type: 'deadline_overdue',
              relatedItem: { type: 'project', id: project._id },
              priority: 'high'
            });

            project.deadlineNotifications.push({
              type: 'overdue',
              sentTo: member._id,
              sentAt: new Date()
            });
            notificationsSent++;
          }
        }
        await project.save();
      } catch (projectError) {
        errors.push(`Project ${project._id}: ${projectError.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Deadline notifications completed in ${duration}ms`);
    console.log(`📊 Statistics: ${notificationsSent} notifications sent`);

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors occurred:`, errors);
    }

    return {
      success: true,
      notificationsSent,
      errors,
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Error sending deadline notifications:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      duration
    });

    return {
      success: false,
      error: error.message,
      duration
    };
  }
};

module.exports = {
  getOverdueItems,
  getUpcomingDeadlines,
  requestTaskExtension,
  requestProjectExtension,
  reviewExtension,
  getDeadlineStats,
  getCalendarData,
  addMilestone,
  completeMilestone,
  sendDeadlineNotifications
}; 