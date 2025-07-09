const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const { createNotificationWithEmail } = require('./notificationController');
const User = require('../models/User');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();

    // Add the task to the project's tasks array if projectId exists
    if (task.projectId) {
      await Project.findByIdAndUpdate(
        task.projectId,
        { $addToSet: { tasks: task._id } },
        { new: true }
      );
    }

    // Create notification and send email if assignedTo is present
    if (task.assignedTo) {
      // Get project name for the notification
      let projectName = 'General';
      if (task.projectId) {
        const project = await Project.findById(task.projectId);
        if (project && project.name) {
          projectName = project.name;
        }
      }

      // Get the assigned user's name
      const assignedUser = await User.findById(task.assignedTo);
      let assignedUserName = 'User';
      if (assignedUser) {
        assignedUserName = assignedUser.name || assignedUser.email || 'User';
      }

      // Create notification with email (this will automatically send the email)
      await createNotificationWithEmail({
        userId: task.assignedTo,
        title: 'New Task Assigned',
        message: `Hi ${assignedUserName}, you have been assigned a new task: ${task.title}.
An email with the details has also been sent to you.`,
        type: 'task_assignment',
        relatedItem: {
          type: 'task',
          id: task._id,
          title: task.title,
          projectName: projectName,
          description: task.description,
          deadline: task.deadline
        },
        priority: 'medium'
      });
    }

    // Update project status when first task is added
    if (task.projectId) {
      await updateProjectStatus(task.projectId);
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all tasks
exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }
    const tasks = await Task.find(filter).populate('assignedTo').populate('projectId');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo').populate('projectId');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Create notification if assignedTo is present and changed
    if (req.body.assignedTo && req.body.assignedTo !== task.assignedTo?.toString()) {
      // Get project name for the notification
      let projectName = 'General';
      if (task.projectId) {
        const project = await Project.findById(task.projectId);
        if (project && project.name) {
          projectName = project.name;
        }
      }

      // Create notification with email for task reassignment
      await createNotificationWithEmail({
        userId: req.body.assignedTo,
        title: 'Task Reassigned',
        message: `You have been assigned a new task: ${task.title}`,
        type: 'task_assignment',
        relatedItem: {
          type: 'task',
          id: task._id,
          title: task.title,
          projectName: projectName
        },
        priority: 'medium'
      });
    }

    // Update project status based on task completion
    if (task.projectId) {
      await updateProjectStatus(task.projectId);
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Helper function to update project status based on task completion
const updateProjectStatus = async (projectId) => {
  try {
    const tasks = await Task.find({ projectId });
    if (tasks.length === 0) return;

    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const totalTasks = tasks.length;
    const progressPercentage = (completedTasks / totalTasks) * 100;

    let newStatus = 'not started';
    if (progressPercentage === 100) {
      newStatus = 'completed';
    } else if (progressPercentage > 0) {
      newStatus = 'in progress';
    }

    await Project.findByIdAndUpdate(projectId, { status: newStatus });
  } catch (err) {
    console.error('Error updating project status:', err);
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    // Remove the task from the project's tasks array if projectId exists
    if (task.projectId) {
      await Project.findByIdAndUpdate(
        task.projectId,
        { $pull: { tasks: task._id } },
        { new: true }
      );
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Bulk assign tasks
exports.bulkAssignTasks = async (req, res) => {
  try {
    const { taskIds, assignedTo } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'Task IDs array is required' });
    }

    if (!assignedTo) {
      return res.status(400).json({ error: 'Assigned user is required' });
    }

    // Update all tasks
    const updatePromises = taskIds.map(taskId =>
      Task.findByIdAndUpdate(taskId, { assignedTo }, { new: true, runValidators: true })
    );

    const updatedTasks = await Promise.all(updatePromises);

    // Create notifications for each assigned task
    const notificationPromises = updatedTasks.map(async (task) => {
      let projectName = 'Unknown Project';
      if (task.projectId) {
        const project = await Project.findById(task.projectId);
        if (project && project.name) {
          projectName = project.name;
        }
      }
      return createNotificationWithEmail({
        userId: assignedTo,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${task.title}`,
        type: 'task_assignment',
        priority: 'medium',
        relatedItem: {
          type: 'task',
          id: task._id,
          title: task.title,
          projectName: projectName
        }
      });
    });

    await Promise.all(notificationPromises);

    // Update project statuses
    const projectIds = [...new Set(updatedTasks.map(task => task.projectId).filter(Boolean))];
    const projectUpdatePromises = projectIds.map(projectId => updateProjectStatus(projectId));
    await Promise.all(projectUpdatePromises);

    res.json({
      message: `Successfully assigned ${updatedTasks.length} tasks`,
      tasks: updatedTasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 