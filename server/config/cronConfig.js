// Cron job configuration
const cronConfig = {
  // Deadline notification settings
  deadlineNotifications: {
    enabled: process.env.DEADLINE_NOTIFICATIONS_ENABLED !== 'false', // Default: true
    schedule: process.env.DEADLINE_NOTIFICATIONS_SCHEDULE || '0 9 * * *', // Default: daily at 9:00 AM
    timezone: process.env.DEADLINE_NOTIFICATIONS_TIMEZONE || 'UTC',
    // Notification thresholds (in days)
    thresholds: {
      overdue: 0, // Notify immediately when overdue
      urgent: 1,  // 1 day before deadline
      warning: 3, // 3 days before deadline
      reminder: 7 // 7 days before deadline
    }
  },

  // Overdue checks settings
  overdueChecks: {
    enabled: process.env.OVERDUE_CHECKS_ENABLED === 'true', // Default: false
    schedule: process.env.OVERDUE_CHECKS_SCHEDULE || '0 */6 * * *', // Default: every 6 hours
    timezone: process.env.OVERDUE_CHECKS_TIMEZONE || 'UTC'
  },

  // General settings
  general: {
    maxRetries: parseInt(process.env.CRON_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.CRON_RETRY_DELAY) || 5000, // 5 seconds
    logLevel: process.env.CRON_LOG_LEVEL || 'info' // 'debug', 'info', 'warn', 'error'
  }
};

// Validation function
const validateConfig = () => {
  const errors = [];

  // Validate cron expressions
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

  if (!cronRegex.test(cronConfig.deadlineNotifications.schedule)) {
    errors.push('Invalid deadline notifications schedule format');
  }

  if (!cronRegex.test(cronConfig.overdueChecks.schedule)) {
    errors.push('Invalid overdue checks schedule format');
  }

  // Validate timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: cronConfig.deadlineNotifications.timezone });
  } catch (e) {
    errors.push('Invalid deadline notifications timezone');
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: cronConfig.overdueChecks.timezone });
  } catch (e) {
    errors.push('Invalid overdue checks timezone');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get configuration for a specific job
const getJobConfig = (jobName) => {
  return cronConfig[jobName] || null;
};

// Update configuration (for runtime changes)
const updateConfig = (updates) => {
  Object.assign(cronConfig, updates);
  const validation = validateConfig();

  if (!validation.isValid) {
    throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
  }

  return cronConfig;
};

module.exports = {
  cronConfig,
  validateConfig,
  getJobConfig,
  updateConfig
}; 