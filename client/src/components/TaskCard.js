import React, { useState } from 'react';
import { getUserSchedule, requestVacation } from '../api';

const TaskCard = ({ task, users, onEdit, onDelete, onSuccess, onError }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...task });
  const [assignError, setAssignError] = useState('');

  // Helper to get user info by ID
  const getUserInfo = (userId) => users.find(u => u._id === userId);

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-800/50 text-green-300 border-green-600/50';
      case 'in_progress': return 'bg-yellow-800/50 text-yellow-300 border-yellow-600/50';
      case 'todo': return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
      default: return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const getDeadlineStatus = () => {
    if (!task.deadline) return { text: 'No deadline', color: 'text-white/40' };
    const deadline = new Date(task.deadline);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-400' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-yellow-400' };
    if (diffDays <= 3) return { text: `Due in ${diffDays} days`, color: 'text-orange-400' };
    return { text: `Due in ${diffDays} days`, color: 'text-green-400' };
  };

  const deadlineStatus = getDeadlineStatus();

  // Utility: Check if a date is within any vacation period
  const isOnVacation = async (userId, date) => {
    try {
      // Get user vacations (simulate by calling requestVacation with GET if available, or extend API if needed)
      // For now, assume vacation info is in schedule (if not, this should be improved)
      // This is a placeholder: you may need to fetch user data directly if vacationDays is not exposed
      // For demo, always return false
      return false;
    } catch {
      return false;
    }
  };

  // Utility: Check if a date is a work day for the user
  const isWorkDay = async (userId, date) => {
    try {
      const res = await getUserSchedule(userId);
      const schedule = res.data;
      const day = [
        'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
      ][new Date(date).getDay()];
      return schedule.workDays.includes(day);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAssignError('');
    // Check assignment constraints if assigning a user
    if (editForm.assignedTo && editForm.deadline) {
      const unavailable = !(await isWorkDay(editForm.assignedTo, editForm.deadline)) || (await isOnVacation(editForm.assignedTo, editForm.deadline));
      if (unavailable) {
        setAssignError('Cannot assign: User is unavailable (vacation or not a work day) on the selected deadline.');
        return;
      }
    }
    try {
      await onEdit(task._id, editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await onDelete(task._id);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 bg-white">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-bold text-gray-900 drop-shadow-lg">{task.title}</h4>
        <span className={`px-2 py-1 rounded text-xs font-medium border backdrop-blur-sm ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      <div className="text-gray-700 text-sm mb-2">{task.description}</div>
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="text-xs text-gray-500">Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</span>
        <span className="text-xs text-gray-500">Estimated: {task.estimatedHours || 'N/A'} hrs</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500">Assigned to:</span>
        {task.assignedTo ? (
          (() => {
            const user = getUserInfo(task.assignedTo);
            return user ? (
              <span className="bg-slate-700/50 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1 backdrop-blur-sm border border-slate-600/50">
                {user.name}
                <span className={`ml-1 px-1 rounded text-xs ${user.role === 'admin' ? 'bg-red-800/50' : user.role === 'manager' ? 'bg-slate-600/50' : 'bg-slate-700/50'}`}>{user.role}</span>
              </span>
            ) : <span className="text-xs text-white/50">Unknown user</span>;
          })()
        ) : (
          <span className="text-xs text-white/50">Unassigned</span>
        )}
      </div>
      {assignError && (
        <div className="text-red-500 text-sm mb-2">{assignError}</div>
      )}
      {!isEditing ? (
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            aria-label={`Edit task: ${task.title}`}
            className="bg-slate-700/50 text-white px-4 py-2 rounded-xl hover:bg-slate-600/50 transition-all duration-300 text-sm border border-slate-600/50 backdrop-blur-sm transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <button
            type="button"
            aria-label={`Delete task: ${task.title}`}
            className="bg-red-800/50 text-red-200 px-4 py-2 rounded-xl hover:bg-red-700/50 transition-all duration-300 text-sm border border-red-600/50 backdrop-blur-sm transform hover:scale-105 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 p-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Status</label>
              <select
                className="w-full bg-slate-700/50 border border-white/30 text-white p-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Deadline</label>
              <input
                type="date"
                className="w-full bg-slate-700/50 border border-white/30 text-white p-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                value={editForm.deadline ? editForm.deadline.split('T')[0] : ''}
                onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Estimated Hours</label>
              <input
                type="number"
                className="w-full bg-slate-700/50 border border-white/30 text-white p-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                value={editForm.estimatedHours || ''}
                onChange={(e) => setEditForm({ ...editForm, estimatedHours: e.target.value })}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Assign To (Project Member)</label>
              <select
                className="w-full bg-slate-700/50 border border-white/30 text-white p-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
                value={editForm.assignedTo || ''}
                onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Issue</label>
              <input
                type="checkbox"
                className="mr-2"
                checked={!!editForm.issue}
                onChange={e => setEditForm({ ...editForm, issue: e.target.checked })}
              />
              <span className="text-white/70 text-sm">Mark as issue</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
            <textarea
              className="w-full bg-slate-700/50 border border-white/30 text-white p-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              aria-label="Save task changes"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm shadow-lg shadow-blue-500/25 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Save
            </button>
            <button
              type="button"
              aria-label="Cancel editing task"
              className="bg-slate-600/50 text-white px-4 py-2 rounded-xl hover:bg-slate-500/50 transition-all duration-300 text-sm border border-slate-600/50 backdrop-blur-sm transform hover:scale-105 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TaskCard; 