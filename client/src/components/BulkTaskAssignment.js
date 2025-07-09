import React, { useState } from 'react';
import { getUserSchedule } from '../api';

const BulkTaskAssignment = ({ tasks, users, onBulkAssign, onSuccess, onError }) => {
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const handleTaskSelect = (taskId) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task._id));
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

  // Utility: Check if a date is within any vacation period
  const isOnVacation = async (userId, date) => {
    try {
      // For now, always return false (placeholder). Extend to fetch vacation info if available.
      return false;
    } catch {
      return false;
    }
  };

  const handleBulkAssign = async () => {
    setAssignError('');
    if (!selectedUser || selectedTasks.length === 0) {
      onError('Please select a user and at least one task');
      return;
    }
    // Check all selected tasks' deadlines for work day and vacation
    const unavailableTasks = [];
    for (const taskId of selectedTasks) {
      const task = tasks.find(t => t._id === taskId);
      if (task.deadline) {
        const isAvailable = await isWorkDay(selectedUser, task.deadline);
        const onVacation = await isOnVacation(selectedUser, task.deadline);
        if (!isAvailable || onVacation) {
          unavailableTasks.push(task.title);
        }
      }
    }
    if (unavailableTasks.length > 0) {
      setAssignError(`Cannot assign: User is unavailable (vacation or not a work day) for the following task(s): ${unavailableTasks.join(', ')}`);
      return;
    }
    setIsAssigning(true);
    try {
      await onBulkAssign(selectedTasks, selectedUser);
      setSelectedTasks([]);
      setSelectedUser('');
      onSuccess(`Successfully assigned ${selectedTasks.length} task(s) to ${users.find(u => u._id === selectedUser)?.name}`);
    } catch (error) {
      onError('Failed to assign tasks. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignedTasks = tasks.filter(task => !task.assignedTo);

  if (unassignedTasks.length === 0) {
    return (
      <div className="backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl bg-slate-800/30">
        <h3 className="text-lg font-bold text-white mb-4 drop-shadow-lg">Bulk Task Assignment</h3>
        <p className="text-white/60 text-center py-4">All tasks are already assigned!</p>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl bg-slate-800/30">
      <h3 className="text-lg font-bold text-white mb-4 drop-shadow-lg">Bulk Task Assignment</h3>

      {/* User Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Assign to Project Member</label>
        <select
          className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm bg-slate-700/50"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          disabled={isAssigning}
        >
          <option value="">Select a project member</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
      </div>

      {/* Task Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-white drop-shadow-lg">Select Tasks to Assign</label>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {selectedTasks.length === unassignedTasks.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {unassignedTasks.map(task => (
            <div key={task._id} className="flex items-center gap-3 p-3 backdrop-blur-sm bg-slate-700/30 rounded-lg border border-white/10 hover:bg-slate-700/50 transition-colors">
              <input
                type="checkbox"
                checked={selectedTasks.includes(task._id)}
                onChange={() => handleTaskSelect(task._id)}
                className="rounded border-white/30 text-blue-500 focus:ring-blue-400 focus:ring-2"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{task.title}</div>
                <div className="text-xs text-white/60">{task.description}</div>
              </div>
              <div className="text-xs text-white/50">
                {task.estimatedHours ? `${task.estimatedHours}h` : 'No estimate'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleBulkAssign}
          disabled={!selectedUser || selectedTasks.length === 0 || isAssigning}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/25 transform hover:scale-105"
        >
          {isAssigning ? 'Assigning...' : `Assign ${selectedTasks.length} Task(s)`}
        </button>
        <button
          onClick={() => {
            setSelectedTasks([]);
            setSelectedUser('');
          }}
          disabled={isAssigning}
          className="px-4 py-2 border border-white/30 text-white rounded-xl hover:bg-slate-700/50 transition-all duration-300 disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      {assignError && (
        <div className="text-red-500 text-sm mb-2">{assignError}</div>
      )}

      {selectedTasks.length > 0 && (
        <p className="text-sm text-white/60 mt-3">
          {selectedTasks.length} task(s) selected for assignment
        </p>
      )}
    </div>
  );
};

export default BulkTaskAssignment; 