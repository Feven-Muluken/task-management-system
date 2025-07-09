const express = require('express');
const router = express.Router();
const {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  getNotificationStats,
  deleteNotification,
  deleteAllNotifications
} = require('../controllers/notificationController');

// Create a notification
router.post('/', createNotification);

// Get notifications for a user
router.get('/user/:userId', getNotificationsByUser);

// Mark a notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read for a user
router.patch('/user/:userId/read-all', markAllAsRead);

// Get notification statistics for a user
router.get('/user/:userId/stats', getNotificationStats);

// Delete a notification
router.delete('/:id', deleteNotification);

// Delete all notifications for a user
router.delete('/user/:userId/all', deleteAllNotifications);

module.exports = router; 