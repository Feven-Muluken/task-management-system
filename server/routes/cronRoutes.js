const express = require('express');
const router = express.Router();
const { getCronJobStatus } = require('../cronJobs');

// Get cron job status and configuration
router.get('/status', (req, res) => {
  try {
    const status = getCronJobStatus();
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 