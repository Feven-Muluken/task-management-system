const express = require('express');
const router = express.Router();
const {
  getUserSchedule,
  updateUserSchedule,
  requestVacation,
  getTeamAvailability,
  getWorkloadDistribution
} = require('../controllers/scheduleController');

// Get user's work schedule
router.get('/users/:userId/schedule', getUserSchedule);

// Update user's work schedule
router.put('/users/:userId/schedule', updateUserSchedule);

// Request vacation time
router.post('/users/:userId/vacation', requestVacation);

// Get team availability
router.get('/team/availability', getTeamAvailability);

// Get workload distribution
router.get('/team/workload', getWorkloadDistribution);

module.exports = router; 