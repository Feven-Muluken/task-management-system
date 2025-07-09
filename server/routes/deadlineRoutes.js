const express = require('express');
const router = express.Router();
const {
  getOverdueItems,
  getUpcomingDeadlines,
  requestTaskExtension,
  requestProjectExtension,
  reviewExtension,
  getDeadlineStats,
  getCalendarData,
  addMilestone,
  completeMilestone
} = require('../controllers/deadlineController');

// Get overdue items
router.get('/overdue', getOverdueItems);

// Get upcoming deadlines
router.get('/upcoming', getUpcomingDeadlines);

// Get deadline statistics
router.get('/stats', getDeadlineStats);

// Get calendar data
router.get('/calendar', getCalendarData);

// Request deadline extension for task
router.post('/tasks/:taskId/extension', requestTaskExtension);

// Request deadline extension for project
router.post('/projects/:projectId/extension', requestProjectExtension);

// Review deadline extension request
router.put('/:itemType/:itemId/extension/:extensionId', reviewExtension);

// Add milestone to project
router.post('/projects/:projectId/milestones', addMilestone);

// Complete milestone
router.put('/projects/:projectId/milestones/:milestoneId/complete', completeMilestone);

module.exports = router; 