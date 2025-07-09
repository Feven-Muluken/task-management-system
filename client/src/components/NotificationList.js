import React from 'react';

const NotificationList = ({ notifications, onMarkRead }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'deadline': return '⏰';
      case 'task_assigned': return '📋';
      case 'project_update': return '📁';
      case 'issue': return '🚨';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'deadline': return 'border-red-500/50 bg-red-500/10';
      case 'task_assigned': return 'border-blue-500/50 bg-blue-500/10';
      case 'project_update': return 'border-green-500/50 bg-green-500/10';
      case 'issue': return 'border-orange-500/50 bg-orange-500/10';
      default: return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  // Helper to format notification message
  const formatMessage = (notification) => {
    if (notification.type === 'task_assignment') {
      return (
        <span>
          <strong>{notification.message}</strong>
        </span>
      );
    }
    return notification.message;
  };

  // Helper to get the correct date field
  const getDate = (notification) => {
    // Prefer createdAt, then timestamp, then emailSentAt
    return notification.createdAt || notification.timestamp || notification.emailSentAt;
  };

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-lg mb-2">No notifications</div>
        <div className="text-gray-300 text-sm">You're all caught up!</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification._id}
          className={`p-4 rounded-xl border-l-4 ${getNotificationColor(notification.type)} ${!notification.read ? 'bg-gray-100' : 'bg-gray-50'} transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="text-lg">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold mb-1 drop-shadow-sm ${notification.title === 'New Task Assigned' ? 'text-blue-700' : 'text-gray-900'}`}>
                  {notification.title}
                </h4>
                <p className="text-xs text-gray-700 mb-2">
                  {formatMessage(notification)}
                </p>
                <div className="text-xs text-gray-500">
                  {getDate(notification) ? new Date(getDate(notification)).toLocaleString() : 'No date'}
                </div>
              </div>
            </div>
            {!notification.read && (
              <button
                onClick={() => onMarkRead(notification._id)}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs hover:bg-blue-200 transition-all duration-300 border border-blue-200 transform hover:scale-105"
              >
                Mark Read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList; 