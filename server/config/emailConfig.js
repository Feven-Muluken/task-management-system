require('dotenv').config();
// Email Configuration
// This file contains email settings and setup instructions

// Robust parsing for ENABLE_EMAIL_NOTIFICATIONS
const parseEnableEmailNotifications = (val) => {
  if (!val) return false;
  return String(val).trim().toLowerCase() === 'true';
};

const emailConfig = {
  // Email service configuration
  service: process.env.EMAIL_SERVICE || 'gmail', // 'gmail', 'outlook', 'yahoo', etc.

  // Email credentials (set these in your .env file)
  user: process.env.EMAIL_USER || 'your-email@gmail.com',
  pass: process.env.EMAIL_PASSWORD || 'your-app-password',

  // Email settings
  from: process.env.EMAIL_FROM || 'Task Management System <your-email@gmail.com>',

  // Notification settings
  enableEmailNotifications: parseEnableEmailNotifications(process.env.ENABLE_EMAIL_NOTIFICATIONS),

  // Email templates
  templates: {
    taskAssignment: {
      subject: 'New Task Assigned',
      priority: 'medium'
    },
    deadlineReminder: {
      subject: 'Deadline Reminder',
      priority: 'high'
    },
    overdueNotification: {
      subject: 'URGENT: Task Overdue',
      priority: 'urgent'
    },
    vacationRequest: {
      subject: 'Vacation Request',
      priority: 'medium'
    },
    vacationResponse: {
      subject: 'Vacation Request Update',
      priority: 'medium'
    },
    issueUpdate: {
      subject: 'Issue Update',
      priority: 'medium'
    }
  }
};

// Setup instructions for different email providers
const setupInstructions = {
  gmail: {
    steps: [
      '1. Enable 2-Factor Authentication on your Gmail account',
      '2. Generate an App Password:',
      '   - Go to Google Account settings',
      '   - Security > 2-Step Verification > App passwords',
      '   - Generate a new app password for "Mail"',
      '3. Use your Gmail address and the generated app password in .env file'
    ],
    envExample: `
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
EMAIL_SERVICE=gmail
ENABLE_EMAIL_NOTIFICATIONS=true
    `
  },
  outlook: {
    steps: [
      '1. Enable 2-Factor Authentication on your Outlook account',
      '2. Generate an App Password:',
      '   - Go to Account settings > Security',
      '   - Advanced security options > App passwords',
      '   - Generate a new app password',
      '3. Use your Outlook email and the generated app password in .env file'
    ],
    envExample: `
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
EMAIL_SERVICE=outlook
ENABLE_EMAIL_NOTIFICATIONS=true
    `
  },
  yahoo: {
    steps: [
      '1. Enable 2-Factor Authentication on your Yahoo account',
      '2. Generate an App Password:',
      '   - Go to Account Security > App passwords',
      '   - Generate a new app password',
      '3. Use your Yahoo email and the generated app password in .env file'
    ],
    envExample: `
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
EMAIL_SERVICE=yahoo
ENABLE_EMAIL_NOTIFICATIONS=true
    `
  }
};

// Validation function
const validateEmailConfig = () => {
  const errors = [];

  if (!emailConfig.user || emailConfig.user === 'your-email@gmail.com') {
    errors.push('EMAIL_USER is not configured');
  }

  if (!emailConfig.pass || emailConfig.pass === 'your-app-password') {
    errors.push('EMAIL_PASSWORD is not configured');
  }

  if (!emailConfig.enableEmailNotifications) {
    errors.push('Email notifications are disabled (ENABLE_EMAIL_NOTIFICATIONS=false)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    config: emailConfig
  };
};

// Get setup instructions for a specific provider
const getSetupInstructions = (provider = 'gmail') => {
  return setupInstructions[provider] || setupInstructions.gmail;
};

module.exports = {
  emailConfig,
  setupInstructions,
  validateEmailConfig,
  getSetupInstructions
}; 