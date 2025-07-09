import React, { useState, useEffect } from 'react';
import {
  getOverdueItems,
  getUpcomingDeadlines,
  getDeadlineStats,
  getCalendarData,
  requestTaskExtension,
  requestProjectExtension,
  reviewExtension,
  addMilestone,
  completeMilestone,
  getTasks,
  updateTask
} from '../api';

const DeadlineManagement = ({ userId, onSuccess, onError }) => {
  const [activeTab, setActiveTab] = useState('overdue');
  const [overdueItems, setOverdueItems] = useState({ overdueTasks: [], overdueProjects: [] });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState({ upcomingTasks: [], upcomingProjects: [] });
  const [deadlineStats, setDeadlineStats] = useState({});
  const [calendarData, setCalendarData] = useState({ tasks: [], projects: [], milestones: [] });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [extensionForm, setExtensionForm] = useState({ newDeadline: '', reason: '' });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', dueDate: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (userId) {
      fetchDeadlineData();
      fetchTasks();
    }
  }, [userId]);

  const fetchDeadlineData = async () => {
    setLoading(true);
    try {
      const [overdueRes, upcomingRes, statsRes] = await Promise.all([
        getOverdueItems(userId),
        getUpcomingDeadlines(userId),
        getDeadlineStats(userId)
      ]);

      setOverdueItems(overdueRes.data);
      setUpcomingDeadlines(upcomingRes.data);
      setDeadlineStats(statsRes.data);

      // Load calendar data for current month
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      const calendarRes = await getCalendarData(userId, startDate.toISOString(), endDate.toISOString());
      setCalendarData(calendarRes.data);
    } catch (error) {
      onError('Failed to fetch deadline data. Please try again.');
      console.error('Failed to fetch deadline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await getTasks();
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleRequestExtension = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setLoading(true);
    try {
      const { type, id } = selectedItem;
      const extensionData = {
        newDeadline: extensionForm.newDeadline,
        reason: extensionForm.reason,
        userId: userId
      };

      if (type === 'task') {
        await requestTaskExtension(id, extensionData);
        onSuccess('Task extension request submitted successfully! Email notification sent to project manager.');
      } else if (type === 'project') {
        await requestProjectExtension(id, extensionData);
        onSuccess('Project extension request submitted successfully! Email notifications sent to team members.');
      }

      setExtensionForm({ newDeadline: '', reason: '' });
      setSelectedItem(null);
      setShowExtensionModal(false);
      fetchDeadlineData();
    } catch (error) {
      onError(error.response?.data?.error || 'Failed to submit extension request. Please try again.');
      console.error('Failed to submit extension request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    try {
      await addMilestone(selectedItem.id, milestoneForm);
      setShowMilestoneModal(false);
      setMilestoneForm({ title: '', description: '', dueDate: '' });
      setSelectedItem(null);
      fetchDeadlineData();
    } catch (error) {
      alert('Failed to add milestone: ' + error.response?.data?.error);
    }
  };

  const handleCompleteMilestone = async (projectId, milestoneId) => {
    try {
      await completeMilestone(projectId, milestoneId);
      fetchDeadlineData();
    } catch (error) {
      alert('Failed to complete milestone: ' + error.response?.data?.error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { color: 'text-white/40', text: 'No deadline' };
    const days = getDaysUntilDeadline(deadline);
    if (days < 0) return { color: 'text-red-400', text: 'Overdue' };
    if (days === 0) return { color: 'text-orange-400', text: 'Due today' };
    if (days <= 3) return { color: 'text-yellow-400', text: `Due in ${days} days` };
    return { color: 'text-green-400', text: `Due in ${days} days` };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'bg-slate-700/50 text-slate-200 border-slate-600/50';
      case 'in_progress': return 'bg-blue-800/50 text-blue-200 border-blue-600/50';
      case 'done': return 'bg-green-800/50 text-green-200 border-green-600/50';
      default: return 'bg-slate-700/50 text-slate-200 border-slate-600/50';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return getDaysUntilDeadline(task.deadline) < 0;
    if (filter === 'upcoming') {
      const days = getDaysUntilDeadline(task.deadline);
      return days >= 0 && days <= 7;
    }
    return true;
  });

  const overdueTasks = tasks.filter(task => getDaysUntilDeadline(task.deadline) < 0);
  const upcomingTasks = tasks.filter(task => {
    const days = getDaysUntilDeadline(task.deadline);
    return days >= 0 && days <= 7;
  });

  const renderOverdueSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
            <span className="w-6 h-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white text-xs">🚨</span>
            </span>
            Overdue Tasks ({overdueItems.overdueTasks.length})
          </h3>
          {overdueItems.overdueTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-300 to-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-gray-500 font-medium">No overdue tasks</p>
              <p className="text-gray-400 text-sm">Great job staying on track!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueItems.overdueTasks.map((task, index) => (
                <div
                  key={task._id}
                  className="bg-white/80 backdrop-blur-sm border border-red-300/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800 text-lg">{task.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">Project: {task.projectId?.name}</p>
                      <p className="text-sm text-red-600 font-medium">
                        ⏰ Overdue by {Math.abs(getDaysUntilDeadline(task.deadline))} days
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedItem({ type: 'task', id: task._id, name: task.title });
                        setShowExtensionModal(true);
                      }}
                      className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-rose-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium"
                    >
                      ⏰ Request Extension
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
            <span className="w-6 h-6 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white text-xs">📁</span>
            </span>
            Overdue Projects ({overdueItems.overdueProjects.length})
          </h3>
          {overdueItems.overdueProjects.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-300 to-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-gray-500 font-medium">No overdue projects</p>
              <p className="text-gray-400 text-sm">All projects are on schedule!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueItems.overdueProjects.map((project, index) => (
                <div
                  key={project._id}
                  className="bg-white/80 backdrop-blur-sm border border-red-300/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800 text-lg">{project.name}</h4>
                      <p className="text-sm text-red-600 font-medium">
                        ⏰ Overdue by {Math.abs(getDaysUntilDeadline(project.deadline))} days
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedItem({ type: 'project', id: project._id, name: project.name });
                        setShowExtensionModal(true);
                      }}
                      className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-rose-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium"
                    >
                      ⏰ Request Extension
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUpcomingSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
            <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white text-xs">📋</span>
            </span>
            Upcoming Tasks ({upcomingDeadlines.upcomingTasks.length})
          </h3>
          {upcomingDeadlines.upcomingTasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-gray-500 font-medium">No upcoming tasks</p>
              <p className="text-gray-400 text-sm">All caught up for now!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.upcomingTasks.map((task, index) => (
                <div
                  key={task._id}
                  className="bg-white/80 backdrop-blur-sm border border-blue-300/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-800 text-lg">{task.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">Project: {task.projectId?.name}</p>
                      <p className={`text-sm font-medium ${getDeadlineStatus(task.deadline).color.replace('text-', 'bg-')}`}>
                        ⏰ Due in {getDaysUntilDeadline(task.deadline)} days
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedItem({ type: 'task', id: task._id, name: task.title });
                        setShowExtensionModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium"
                    >
                      ⏰ Request Extension
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
            <span className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white text-xs">📁</span>
            </span>
            Upcoming Projects ({upcomingDeadlines.upcomingProjects.length})
          </h3>
          {upcomingDeadlines.upcomingProjects.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📁</span>
              </div>
              <p className="text-gray-500 font-medium">No upcoming projects</p>
              <p className="text-gray-400 text-sm">All caught up for now!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.upcomingProjects.map((project, index) => (
                <div
                  key={project._id}
                  className="bg-white/80 backdrop-blur-sm border border-blue-300/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-800 text-lg">{project.name}</h4>
                      <p className={`text-sm font-medium ${getDeadlineStatus(project.deadline).color.replace('text-', 'bg-')}`}>
                        ⏰ Due in {getDaysUntilDeadline(project.deadline)} days
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedItem({ type: 'project', id: project._id, name: project.name });
                        setShowExtensionModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium"
                    >
                      ⏰ Request Extension
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStatsSection = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <h3 className="text-2xl font-bold text-green-700">{deadlineStats.tasks?.total || 0}</h3>
        <p className="text-sm text-green-600">Total Tasks</p>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <h3 className="text-2xl font-bold text-red-700">{deadlineStats.tasks?.overdue || 0}</h3>
        <p className="text-sm text-red-600">Overdue Tasks</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <h3 className="text-2xl font-bold text-blue-700">{deadlineStats.tasks?.upcoming || 0}</h3>
        <p className="text-sm text-blue-600">Upcoming Tasks</p>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
        <h3 className="text-2xl font-bold text-purple-700">{deadlineStats.projects?.total || 0}</h3>
        <p className="text-sm text-purple-600">Total Projects</p>
      </div>
    </div>
  );

  const renderCalendarSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white ">Calendar View</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            }}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Previous Month
          </button>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            }}
            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
          >
            Next Month
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-semibold mb-3">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h4>

        <div className="space-y-2">
          {calendarData.tasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
              <span className="text-blue-600">📋</span>
              <span className="font-medium">{task.title}</span>
              <span className="text-sm text-gray-600">- {formatDate(task.date)}</span>
              {task.isOverdue && <span className="text-red-600 text-sm">(Overdue)</span>}
            </div>
          ))}

          {calendarData.projects.map(project => (
            <div key={project.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
              <span className="text-purple-600">📁</span>
              <span className="font-medium">{project.title}</span>
              <span className="text-sm text-gray-600">- {formatDate(project.date)}</span>
              {project.isOverdue && <span className="text-red-600 text-sm">(Overdue)</span>}
            </div>
          ))}

          {calendarData.milestones.map(milestone => (
            <div key={milestone.id} className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <span className="text-green-600">🎯</span>
              <span className="font-medium">{milestone.title}</span>
              <span className="text-sm text-gray-600">- {formatDate(milestone.date)}</span>
              {milestone.completed && <span className="text-green-600 text-sm">(Completed)</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6 shadow-xl bg-slate-800/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white drop-shadow-lg">Deadline Management</h2>
        <button
          type="button"
          aria-label={loading ? 'Refreshing deadline data...' : 'Refresh deadline data'}
          onClick={fetchDeadlineData}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/25 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Deadline Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-white mb-1 drop-shadow-sm">{(deadlineStats.tasks?.total || 0) + (deadlineStats.projects?.total || 0)}</div>
          <div className="text-xs text-white/60">Total Items</div>
        </div>
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-red-400 mb-1 drop-shadow-sm">{(deadlineStats.tasks?.overdue || 0) + (deadlineStats.projects?.overdue || 0)}</div>
          <div className="text-xs text-white/60">Overdue</div>
        </div>
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-yellow-400 mb-1 drop-shadow-sm">{(deadlineStats.tasks?.upcoming || 0) + (deadlineStats.projects?.upcoming || 0)}</div>
          <div className="text-xs text-white/60">Due This Week</div>
        </div>
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-green-400 mb-1 drop-shadow-sm">{(deadlineStats.tasks?.onTime || 0) + (deadlineStats.projects?.onTime || 0)}</div>
          <div className="text-xs text-white/60">Completed</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 font-medium ${activeTab === 'overdue' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Overdue Items
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-medium ${activeTab === 'upcoming' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Upcoming Deadlines
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium ${activeTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 font-medium ${activeTab === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Calendar View
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overdue' && renderOverdueSection()}
        {activeTab === 'upcoming' && renderUpcomingSection()}
        {activeTab === 'stats' && renderStatsSection()}
        {activeTab === 'calendar' && renderCalendarSection()}
      </div>

      {/* Extension Request Modal */}
      {showExtensionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Request Extension for {selectedItem?.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Deadline</label>
                <input
                  type="date"
                  value={extensionForm.newDeadline}
                  onChange={(e) => setExtensionForm({ ...extensionForm, newDeadline: e.target.value })}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={extensionForm.reason}
                  onChange={(e) => setExtensionForm({ ...extensionForm, reason: e.target.value })}
                  className="w-full border rounded p-2"
                  rows="3"
                  placeholder="Explain why you need an extension..."
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleRequestExtension}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Submit Request
              </button>
              <button
                onClick={() => {
                  setShowExtensionModal(false);
                  setExtensionForm({ newDeadline: '', reason: '' });
                  setSelectedItem(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Add Milestone to {selectedItem?.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Milestone Title</label>
                <input
                  type="text"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full border rounded p-2"
                  placeholder="Enter milestone title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="w-full border rounded p-2"
                  rows="3"
                  placeholder="Describe the milestone..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddMilestone}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Add Milestone
              </button>
              <button
                onClick={() => {
                  setShowMilestoneModal(false);
                  setMilestoneForm({ title: '', description: '', dueDate: '' });
                  setSelectedItem(null);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlineManagement; 