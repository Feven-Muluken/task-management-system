const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// Get user's work schedule
exports.getUserSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if workSchedule exists, if not create default
    if (!user.workSchedule || !user.workSchedule.monday) {
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

      await user.save();
    }

    // Transform the workSchedule data to match frontend expectations
    const workDays = Object.keys(user.workSchedule).filter(day => user.workSchedule[day].available);
    const schedule = {
      workDays,
      startTime: user.preferredWorkingHours?.start || '09:00',
      endTime: user.preferredWorkingHours?.end || '17:00',
      timezone: user.timezone || 'UTC'
    };

    res.json(schedule);
  } catch (error) {
    console.error('Error in getUserSchedule:', error);
    res.status(500).json({ error: 'Failed to fetch user schedule' });
  }
};

// Update user's work schedule
exports.updateUserSchedule = async (req, res) => {
  try {
    const { workDays, startTime, endTime, timezone } = req.body;

    // Transform frontend data to match User model structure
    const workSchedule = {
      monday: { start: startTime, end: endTime, available: workDays.includes('monday') },
      tuesday: { start: startTime, end: endTime, available: workDays.includes('tuesday') },
      wednesday: { start: startTime, end: endTime, available: workDays.includes('wednesday') },
      thursday: { start: startTime, end: endTime, available: workDays.includes('thursday') },
      friday: { start: startTime, end: endTime, available: workDays.includes('friday') },
      saturday: { start: startTime, end: endTime, available: workDays.includes('saturday') },
      sunday: { start: startTime, end: endTime, available: workDays.includes('sunday') }
    };

    const preferredWorkingHours = {
      start: startTime,
      end: endTime
    };

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        workSchedule,
        timezone,
        preferredWorkingHours
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the transformed schedule data to match frontend expectations
    const updatedSchedule = {
      workDays: Object.keys(user.workSchedule).filter(day => user.workSchedule[day].available),
      startTime: user.preferredWorkingHours?.start || '09:00',
      endTime: user.preferredWorkingHours?.end || '17:00',
      timezone: user.timezone || 'UTC'
    };

    res.json(updatedSchedule);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Request vacation time
exports.requestVacation = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.vacationDays.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await user.save();

    // Notify managers about vacation request
    const managers = await User.find({ role: { $in: ['admin', 'manager'] } });
    for (const manager of managers) {
      await Notification.create({
        userId: manager._id,
        title: 'Vacation Request',
        message: `${user.name} has requested vacation from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
        type: 'vacation_request',
        relatedItem: { type: 'user', id: user._id },
        priority: 'medium'
      });
    }

    res.json(user.vacationDays[user.vacationDays.length - 1]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Get team availability
exports.getTeamAvailability = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    let users;
    if (projectId) {
      const project = await Project.findById(projectId).populate('members');
      users = project.members;
    } else {
      users = await User.find({ isActive: true });
    }

    const availability = await Promise.all(users.map(async (user) => {
      let tasks = [];

      // Only filter by date range if both dates are provided
      if (startDate && endDate) {
        tasks = await Task.find({
          assignedTo: user._id,
          deadline: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });
      } else {
        // Get all tasks for the user if no date range is specified
        tasks = await Task.find({ assignedTo: user._id });
      }

      const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
      const availableHours = user.maxHoursPerWeek - user.currentWorkload;

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        workSchedule: user.workSchedule,
        currentWorkload: user.currentWorkload,
        maxHoursPerWeek: user.maxHoursPerWeek,
        availableHours,
        assignedTasks: tasks.length,
        totalAssignedHours: totalHours,
        isOverloaded: totalHours > availableHours
      };
    }));

    res.json(availability);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get workload distribution
exports.getWorkloadDistribution = async (req, res) => {
  try {
    const users = await User.find({ isActive: true });

    const workloadData = await Promise.all(users.map(async (user) => {
      const tasks = await Task.find({ assignedTo: user._id, status: { $ne: 'done' } });
      const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

      return {
        userId: user._id,
        userName: user.name,
        totalTasks: tasks.length,
        totalHours,
        maxHours: user.maxHoursPerWeek,
        utilization: Math.round((totalHours / user.maxHoursPerWeek) * 100)
      };
    }));

    res.json(workloadData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

