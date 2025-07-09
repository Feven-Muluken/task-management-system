const cron = require('node-cron');
const { sendDeadlineNotifications } = require('./controllers/deadlineController');
const { cronConfig, validateConfig } = require('./config/cronConfig');

// Schedule deadline notifications with better error handling
const scheduleDeadlineNotifications = () => {
  const config = cronConfig.deadlineNotifications;

  if (!config.enabled) {
    console.log('📴 Deadline notifications are disabled');
    return;
  }

  cron.schedule(config.schedule, async () => {
    console.log('🕘 Running scheduled deadline notifications...');
    try {
      const result = await sendDeadlineNotifications();
      if (result.success) {
        console.log(`✅ Deadline notifications completed successfully in ${result.duration}ms`);
        console.log(`📊 Sent ${result.notificationsSent} notifications`);
        if (result.errors.length > 0) {
          console.warn(`⚠️ ${result.errors.length} errors occurred during processing`);
        }
      } else {
        console.error('❌ Deadline notifications failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error running deadline notifications:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }, {
    scheduled: true,
    timezone: config.timezone
  });

  console.log(`📅 Deadline notifications scheduled for ${config.schedule} (${config.timezone})`);
};

// Schedule overdue item checks (simplified and less frequent)
const scheduleOverdueChecks = () => {
  const config = cronConfig.overdueChecks;

  if (!config.enabled) {
    console.log('📴 Overdue checks are disabled');
    return;
  }

  cron.schedule(config.schedule, async () => {
    console.log('🔄 Running overdue item checks...');
    try {
      // This could be expanded to send additional notifications
      // or update project/task statuses
      console.log('✅ Overdue checks completed');
    } catch (error) {
      console.error('❌ Error running overdue checks:', error);
    }
  }, {
    scheduled: true,
    timezone: config.timezone
  });

  console.log(`📅 Overdue checks scheduled for ${config.schedule} (${config.timezone})`);
};

// Initialize all cron jobs with better logging
const initCronJobs = () => {
  console.log('🚀 Initializing cron jobs...');

  // Validate configuration first
  const validation = validateConfig();
  if (!validation.isValid) {
    console.error('❌ Invalid cron configuration:', validation.errors);
    return;
  }

  try {
    scheduleDeadlineNotifications();
    scheduleOverdueChecks();
    console.log('✅ Cron jobs initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize cron jobs:', error);
    // Don't throw error to prevent server startup failure
  }
};

// Utility function to get cron job status
const getCronJobStatus = () => {
  return {
    deadlineNotifications: {
      enabled: cronConfig.deadlineNotifications.enabled,
      schedule: cronConfig.deadlineNotifications.schedule,
      timezone: cronConfig.deadlineNotifications.timezone,
      thresholds: cronConfig.deadlineNotifications.thresholds
    },
    overdueChecks: {
      enabled: cronConfig.overdueChecks.enabled,
      schedule: cronConfig.overdueChecks.schedule,
      timezone: cronConfig.overdueChecks.timezone
    },
    general: cronConfig.general
  };
};

module.exports = {
  initCronJobs,
  scheduleDeadlineNotifications,
  scheduleOverdueChecks,
  getCronJobStatus,
  cronConfig
}; 