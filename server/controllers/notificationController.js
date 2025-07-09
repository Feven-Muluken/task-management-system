const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotificationEmail } = require('../services/emailService');

// Create a notification with email support
exports.createNotification = async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();

    // Send email notification if user exists and email is configured
    if (notification.userId) {
      try {
        const user = await User.findById(notification.userId);
        if (user && user.email) {
          const emailResult = await sendNotificationEmail(user, notification);
          if (emailResult.success) {
            notification.emailSent = true;
            notification.emailSentAt = new Date();
            await notification.save();
          }
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the notification creation if email fails
      }
    }

    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create notification helper function (for internal use)
exports.createNotificationWithEmail = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();

    // Send email notification
    if (notification.userId) {
      try {
        const user = await User.findById(notification.userId);
        if (user && user.email) {
          const emailResult = await sendNotificationEmail(user, notification);
          if (emailResult.success) {
            notification.emailSent = true;
            notification.emailSentAt = new Date();
            await notification.save();
          }
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
exports.getNotificationsByUser = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to prevent performance issues
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const stats = await Notification.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: ['$read', 0, 1] } },
          byType: {
            $push: {
              type: '$type',
              priority: '$priority',
              read: '$read'
            }
          }
        }
      }
    ]);

    const typeStats = {};
    const priorityStats = {};

    if (stats.length > 0) {
      stats[0].byType.forEach(notification => {
        // Count by type
        typeStats[notification.type] = (typeStats[notification.type] || 0) + 1;

        // Count by priority
        priorityStats[notification.priority] = (priorityStats[notification.priority] || 0) + 1;
      });
    }

    res.json({
      total: stats[0]?.total || 0,
      unread: stats[0]?.unread || 0,
      byType: typeStats,
      byPriority: priorityStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete all notifications for a user
exports.deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.params.userId });
    res.json({ message: 'All notifications deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 