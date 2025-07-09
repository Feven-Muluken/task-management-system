# Cron Job Configuration

This document describes the cron job system used for automated deadline notifications and checks.

## Overview

The cron job system provides automated background tasks for:
- **Deadline Notifications**: Sends notifications about approaching and overdue deadlines
- **Overdue Checks**: Monitors for overdue items (currently disabled by default)

## Configuration

### Environment Variables

You can configure the cron jobs using environment variables:

```bash
# Deadline Notifications
DEADLINE_NOTIFICATIONS_ENABLED=true          # Enable/disable deadline notifications
DEADLINE_NOTIFICATIONS_SCHEDULE="0 9 * * *"  # Cron schedule (default: daily at 9:00 AM)
DEADLINE_NOTIFICATIONS_TIMEZONE="UTC"        # Timezone for notifications

# Overdue Checks
OVERDUE_CHECKS_ENABLED=false                 # Enable/disable overdue checks
OVERDUE_CHECKS_SCHEDULE="0 */6 * * *"        # Cron schedule (default: every 6 hours)
OVERDUE_CHECKS_TIMEZONE="UTC"                # Timezone for checks

# General Settings
CRON_MAX_RETRIES=3                           # Maximum retry attempts
CRON_RETRY_DELAY=5000                        # Delay between retries (ms)
CRON_LOG_LEVEL="info"                        # Log level (debug, info, warn, error)
```

### Default Configuration

```javascript
{
  deadlineNotifications: {
    enabled: true,
    schedule: '0 9 * * *',  // Daily at 9:00 AM
    timezone: 'UTC',
    thresholds: {
      overdue: 0,  // Notify immediately when overdue
      urgent: 1,   // 1 day before deadline
      warning: 3,  // 3 days before deadline
      reminder: 7  // 7 days before deadline
    }
  },
  overdueChecks: {
    enabled: false,
    schedule: '0 */6 * * *',  // Every 6 hours
    timezone: 'UTC'
  }
}
```

## Cron Schedule Format

The cron schedule uses the standard format: `minute hour day month day-of-week`

Examples:
- `0 9 * * *` - Daily at 9:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 9,18 * * *` - Twice daily at 9:00 AM and 6:00 PM
- `0 9 * * 1-5` - Weekdays at 9:00 AM

## API Endpoints

### Get Cron Job Status

```http
GET /api/cron/status
```

Response:
```json
{
  "success": true,
  "data": {
    "deadlineNotifications": {
      "enabled": true,
      "schedule": "0 9 * * *",
      "timezone": "UTC",
      "thresholds": {
        "overdue": 0,
        "urgent": 1,
        "warning": 3,
        "reminder": 7
      }
    },
    "overdueChecks": {
      "enabled": false,
      "schedule": "0 */6 * * *",
      "timezone": "UTC"
    },
    "general": {
      "maxRetries": 3,
      "retryDelay": 5000,
      "logLevel": "info"
    }
  },
  "timestamp": "2024-01-01T09:00:00.000Z"
}
```

## Features

### Deadline Notifications

- **Overdue Items**: Notifies users immediately when tasks/projects become overdue
- **Upcoming Deadlines**: Sends reminders at 1, 3, and 7 days before deadlines
- **Duplicate Prevention**: Tracks sent notifications to avoid spam
- **Error Handling**: Graceful error handling with detailed logging
- **Performance Monitoring**: Tracks execution time and notification count

### Error Handling

- Individual task/project errors don't stop the entire process
- Detailed error logging with timestamps
- Graceful degradation if email services fail
- Retry mechanism for failed operations

### Logging

The system provides detailed logging with emojis for easy identification:
- 🚀 Initialization messages
- 📅 Schedule information
- 🕘 Job execution start
- ✅ Success messages
- ❌ Error messages
- ⚠️ Warning messages
- 📊 Statistics

## Monitoring

You can monitor the cron jobs by:

1. **Server Logs**: Check console output for job execution status
2. **API Status**: Use `/api/cron/status` to check configuration
3. **Database**: Check the `notifications` collection for sent notifications
4. **Email Logs**: Monitor email service logs for delivery status

## Troubleshooting

### Common Issues

1. **Jobs not running**: Check if jobs are enabled in configuration
2. **Wrong timezone**: Verify timezone settings match your server location
3. **Email failures**: Check email configuration and network connectivity
4. **Database errors**: Verify MongoDB connection and permissions

### Debug Mode

Enable debug logging by setting:
```bash
CRON_LOG_LEVEL=debug
```

This will provide more detailed information about job execution. 