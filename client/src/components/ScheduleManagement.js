import React, { useState, useEffect } from 'react';
import { getUserSchedule, updateUserSchedule, requestVacation, getTeamAvailability, getWorkloadDistribution } from '../api';

const ScheduleManagement = ({ userId, onSuccess, onError }) => {
  const [schedule, setSchedule] = useState(null);
  const [teamAvailability, setTeamAvailability] = useState([]);
  const [workloadDistribution, setWorkloadDistribution] = useState({});
  const [loading, setLoading] = useState(false);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [vacationForm, setVacationForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'vacation'
  });
  const [scheduleForm, setScheduleForm] = useState({
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'UTC'
  });

  useEffect(() => {
    if (userId) {
      fetchScheduleData();
    } else {
      console.warn('ScheduleManagement: No userId provided');
    }
  }, [userId]);

  const fetchScheduleData = async () => {
    if (!userId) {
      onError('No user ID available. Please ensure you are logged in.');
      return;
    }

    setLoading(true);
    try {
      const [scheduleRes, availabilityRes, workloadRes] = await Promise.all([
        getUserSchedule(userId),
        getTeamAvailability(),
        getWorkloadDistribution()
      ]);

      setSchedule(scheduleRes.data);
      setTeamAvailability(availabilityRes.data);
      setWorkloadDistribution(workloadRes.data);
    } catch (error) {
      console.error('Failed to fetch schedule data:', error);

      // Provide more specific error messages
      if (error.response?.status === 404) {
        onError('User not found. Please check your login status.');
      } else if (error.response?.status === 500) {
        onError('Server error. Please try again later.');
      } else if (!error.response) {
        onError('Network error. Please check your connection.');
      } else {
        onError('Failed to fetch schedule data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVacationRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestVacation(userId, vacationForm);
      onSuccess('Vacation request submitted successfully! Email notification sent to your manager.');
      setVacationForm({
        startDate: '',
        endDate: '',
        reason: '',
        type: 'vacation'
      });
      setShowVacationForm(false);
      fetchScheduleData();
    } catch (error) {
      onError(error.response?.data?.error || 'Failed to submit vacation request. Please try again.');
      console.error('Failed to submit vacation request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserSchedule(userId, scheduleForm);
      onSuccess('Schedule updated successfully!');
      setShowScheduleForm(false);
      fetchScheduleData();
    } catch (error) {
      onError(error.response?.data?.error || 'Failed to update schedule. Please try again.');
      console.error('Failed to update schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkDayColor = (day) => {
    return scheduleForm.workDays.includes(day) ? 'bg-blue-600/50 border border-blue-500/50' : 'bg-slate-600/50 border border-slate-500/50';
  };

  const toggleWorkDay = (day) => {
    const updatedDays = scheduleForm.workDays.includes(day)
      ? scheduleForm.workDays.filter(d => d !== day)
      : [...scheduleForm.workDays, day];
    setScheduleForm({ ...scheduleForm, workDays: updatedDays });
  };

  const getAvailabilityStatus = (availability) => {
    if (availability === 'available') return { text: 'Available', color: 'text-green-400' };
    if (availability === 'busy') return { text: 'Busy', color: 'text-yellow-400' };
    if (availability === 'vacation') return { text: 'Vacation', color: 'text-blue-400' };
    if (availability === 'sick') return { text: 'Sick Leave', color: 'text-red-400' };
    return { text: 'Unknown', color: 'text-gray-400' };
  };

  const getWorkloadColor = (workload) => {
    if (workload < 50) return 'text-green-400';
    if (workload < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6 shadow-xl bg-slate-800/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white drop-shadow-lg">Schedule Management</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label={showScheduleForm ? 'Cancel updating schedule' : 'Update work schedule'}
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/25 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            disabled={loading}
          >
            {showScheduleForm ? 'Cancel' : 'Update Schedule'}
          </button>
          <button
            type="button"
            aria-label={showVacationForm ? 'Cancel vacation request' : 'Request vacation time'}
            onClick={() => setShowVacationForm(!showVacationForm)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-green-500/25 transform hover:scale-105 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            disabled={loading}
          >
            {showVacationForm ? 'Cancel' : 'Request Vacation'}
          </button>
        </div>
      </div>

      {/* Current Schedule Display */}
      {schedule && (
        <div className="mb-6 p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 drop-shadow-lg">Current Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-white font-semibold mb-2 drop-shadow-sm">Work Days</h4>
              <div className="flex flex-wrap gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <span
                    key={day}
                    className={`px-3 py-1 rounded-lg text-white text-sm font-medium backdrop-blur-sm ${schedule.workDays?.includes(day) ? 'bg-blue-600/50 border border-blue-500/50' : 'bg-slate-600/50 border border-slate-500/50'
                      }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 drop-shadow-sm">Work Hours</h4>
              <p className="text-white/70">
                {schedule.startTime} - {schedule.endTime} ({schedule.timezone})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Update Form */}
      {showScheduleForm && (
        <div className="mb-6 p-6 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 drop-shadow-lg">Update Work Schedule</h3>

          <form onSubmit={handleScheduleUpdate}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-white/80 mb-2">Work Days</label>
              <div className="flex flex-wrap gap-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkDay(day)}
                    className={`px-3 py-2 rounded-lg text-white text-sm font-medium transition-all duration-300 backdrop-blur-sm ${getWorkDayColor(day)
                      }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Start Time</label>
                <input
                  type="time"
                  className="w-full bg-slate-600/50 border border-white/30 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
                  value={scheduleForm.startTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">End Time</label>
                <input
                  type="time"
                  className="w-full bg-slate-600/50 border border-white/30 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
                  value={scheduleForm.endTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                <select
                  className="w-full bg-gray-600 border border-gray-500 text-white p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  value={scheduleForm.timezone}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, timezone: e.target.value })}
                  disabled={loading}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="CET">Central European Time</option>
                  <option value="JST">Japan Standard Time</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Schedule'}
              </button>
              <button
                type="button"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
                onClick={() => setShowScheduleForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vacation Request Form */}
      {showVacationForm && (
        <div className="mb-6 p-6 bg-gray-700 rounded-lg border border-gray-600">
          <h3 className="text-lg font-bold text-white mb-4">Request Vacation/Leave</h3>

          <form onSubmit={handleVacationRequest}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                <input
                  type="date"
                  className="w-full bg-gray-600 border border-gray-500 text-white p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  value={vacationForm.startDate}
                  onChange={(e) => setVacationForm({ ...vacationForm, startDate: e.target.value })}
                  required
                  disabled={loading}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                <input
                  type="date"
                  className="w-full bg-gray-600 border border-gray-500 text-white p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  value={vacationForm.endDate}
                  onChange={(e) => setVacationForm({ ...vacationForm, endDate: e.target.value })}
                  required
                  disabled={loading}
                  min={vacationForm.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
              <select
                className="w-full bg-gray-600 border border-gray-500 text-white p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                value={vacationForm.type}
                onChange={(e) => setVacationForm({ ...vacationForm, type: e.target.value })}
                disabled={loading}
              >
                <option value="vacation">Vacation</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason *</label>
              <textarea
                className="w-full bg-gray-600 border border-gray-500 text-white p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                rows="3"
                value={vacationForm.reason}
                onChange={(e) => setVacationForm({ ...vacationForm, reason: e.target.value })}
                required
                disabled={loading}
                placeholder="Please provide a reason for your leave request..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
                onClick={() => setShowVacationForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Availability */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Team Availability</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading team availability...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamAvailability.map((member) => {
              const status = getAvailabilityStatus(member.availability);
              return (
                <div key={member._id} className="bg-gray-700 rounded-lg border border-gray-600 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-semibold">{member.name}</h4>
                    <span className={`text-sm font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{member.role}</p>
                  {member.currentTask && (
                    <p className="text-gray-400 text-xs">Working on: {member.currentTask}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Workload Distribution */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Workload Distribution</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading workload data...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(workloadDistribution) ? (
              workloadDistribution.map((workload) => (
                <div key={workload.userId} className="bg-gray-700 rounded-lg border border-gray-600 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-semibold">{workload.userName || 'Unknown User'}</h4>
                    <span className={`text-sm font-medium ${getWorkloadColor(workload.utilization)}`}>{workload.utilization}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${workload.utilization < 50 ? 'bg-green-500' : workload.utilization < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(workload.utilization, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-white/60 mt-2">
                    Tasks: {workload.totalTasks} | Hours: {workload.totalHours} / {workload.maxHours}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No workload data available.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManagement; 