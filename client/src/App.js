import React, { useEffect, useState, useRef } from 'react';
import { getProjects, createProject, getTasks, createTask, updateTask, getNotificationsByUser, markNotificationAsRead, getUsers } from './api';
import ProjectCard from './components/ProjectCard';
import TaskCard from './components/TaskCard';
import NotificationList from './components/NotificationList';
import UserManagement from './components/UserManagement';
import ProjectProgress from './components/ProjectProgress';
import IssueManagement from './components/IssueManagement';
import DeadlineManagement from './components/DeadlineManagement';
import ScheduleManagement from './components/ScheduleManagement';
import BulkTaskAssignment from './components/BulkTaskAssignment';
import TaskProgressDashboard from './components/TaskProgressDashboard';
import './App.css';

function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectForm, setProjectForm] = useState({ name: '', description: '', deadline: '', members: [] });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '', assignedTo: '', estimatedHours: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showIssueManagement, setShowIssueManagement] = useState(false);
  const [showDeadlineManagement, setShowDeadlineManagement] = useState(false);
  const [showScheduleManagement, setShowScheduleManagement] = useState(false);
  const [showTaskDashboard, setShowTaskDashboard] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const notificationBellRef = useRef();
  const userId = users && users.length > 0 ? users[0]._id : null;

  // Show success message and clear after 3 seconds
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Show error message and clear after 5 seconds
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Fetch projects and users on mount, and restore selected project from localStorage
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectsRes, usersRes] = await Promise.all([
          getProjects(),
          getUsers()
        ]);
        setProjects(projectsRes.data);
        setUsers(usersRes.data);

        // Restore selected project from localStorage if exists
        const storedProjectId = localStorage.getItem('selectedProjectId');
        if (storedProjectId) {
          const foundProject = projectsRes.data.find(p => p._id === storedProjectId);
          if (foundProject) {
            setSelectedProject(foundProject);
          }
        }
      } catch (err) {
        showError('Failed to load data. Please check your connection and try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Persist selected project in localStorage
  useEffect(() => {
    if (selectedProject && selectedProject._id) {
      localStorage.setItem('selectedProjectId', selectedProject._id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, [selectedProject]);

  // Fetch tasks whenever selectedProject changes
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  // Fetch notifications for user
  useEffect(() => {
    const fetchNotifications = async () => {
      if (userId) {
        try {
          const res = await getNotificationsByUser(userId);
          setNotifications(res.data);
        } catch (err) {
          console.error('Error fetching notifications:', err);
        }
      }
    };
    fetchNotifications();
  }, [userId]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationBellRef.current && !notificationBellRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch projects from backend
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const projectsRes = await getProjects();
      setProjects(projectsRes.data);
      // If a project is selected, update it with the latest data
      if (selectedProject && selectedProject._id) {
        const updated = projectsRes.data.find(p => p._id === selectedProject._id);
        if (updated) setSelectedProject(updated);
      }
    } catch (err) {
      showError('Failed to fetch projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks for selected project
  const fetchTasks = async () => {
    if (selectedProject && selectedProject._id) {
      setLoading(true);
      try {
        const res = await getTasks(selectedProject._id);
        setTasks(res.data.filter(t => t.projectId === selectedProject._id));
      } catch (err) {
        setTasks([]);
        showError('Failed to fetch tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setTasks([]);
    }
  };

  // Handle project form submit
  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const projectData = { ...projectForm };
      if (!projectData.deadline) delete projectData.deadline;
      if (!projectData.members || projectData.members.length === 0) delete projectData.members;

      await createProject(projectData);
      await fetchProjects();
      setProjectForm({ name: '', description: '', deadline: '', members: [] });
      setSelectedUsers([]);
      showSuccess('Project created successfully! Email notifications sent to team members.');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection for project
  const handleUserSelect = (user) => {
    const isSelected = selectedUsers.some(u => u._id === user._id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
      setProjectForm({ ...projectForm, members: projectForm.members.filter(id => id !== user._id) });
    } else {
      setSelectedUsers([...selectedUsers, user]);
      setProjectForm({ ...projectForm, members: [...projectForm.members, user._id] });
    }
  };

  // Handle task form submit
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...taskForm, projectId: selectedProject._id };
      if (!data.assignedTo) delete data.assignedTo;
      if (!data.deadline) delete data.deadline;

      await createTask(data);
      await fetchTasks();
      // Refresh notifications after task assignment
      if (userId) {
        const res = await getNotificationsByUser(userId);
        setNotifications(res.data);
      }
      setTaskForm({ title: '', description: '', deadline: '', assignedTo: '', estimatedHours: '' });
      const assignedUser = users.find(u => u._id === data.assignedTo);
      if (assignedUser) {
        showSuccess(`Task created successfully! Email notification sent to ${assignedUser.name}.`);
      } else {
        showSuccess('Task created successfully!');
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle task edit
  const handleEditTask = async (id, updates) => {
    try {
      await updateTask(id, updates);
      await fetchTasks();
      showSuccess('Task updated successfully!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to update task. Please try again.');
    }
  };

  // Toggle project selection and fetch tasks
  const handleSelectProject = (project) => {
    if (selectedProject && selectedProject._id === project._id) {
      setSelectedProject(null);
      setTasks([]);
    } else {
      setSelectedProject(project);
    }
  };

  // Handle task delete
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await import('./api').then(({ deleteTask }) => deleteTask(id));
      await fetchTasks();
      showSuccess('Task deleted successfully!');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete task. Please try again.');
    }
  };

  // Handle bulk task assignment
  const handleBulkAssign = async (taskIds, userId) => {
    try {
      const { bulkAssignTasks } = await import('./api');
      await bulkAssignTasks(taskIds, userId);
      await fetchTasks();
      return;
    } catch (err) {
      throw err;
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (statusFilter && task.status !== statusFilter) return false;
    return true;
  });

  const handleMarkNotificationRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      showError('Failed to mark notification as read. Please try again.');
    }
  };

  // Add handlers for updating and deleting users globally
  const handleUserUpdate = (updatedUser) => {
    setUsers(users => users.map(u => u._id === updatedUser._id ? updatedUser : u));
  };
  const handleUserDelete = (deletedUserId) => {
    setUsers(users => users.filter(u => u._id !== deletedUserId));
  };

  // Compute project members (populated user objects)
  const projectMembers = selectedProject && selectedProject.members ? selectedProject.members : [];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="backdrop-blur-md shadow-xl border-b border-white/20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">Task Management</h1>
            <div className="flex space-x-3">
              <button
                type="button"
                role="tab"
                aria-pressed={showIssueManagement}
                aria-label={`${showIssueManagement ? 'Hide' : 'Show'} issue management panel`}
                onClick={() => setShowIssueManagement(!showIssueManagement)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${showIssueManagement
                  ? 'bg-purple-500 text-white border border-purple-400 shadow-lg shadow-purple-500/25'
                  : 'text-white border border-white/30 hover:border-purple-400 backdrop-blur-sm bg-slate-800/50'
                  }`}
              >
                {showIssueManagement ? 'Hide Issues' : 'Issues'}
              </button>
              <button
                type="button"
                role="tab"
                aria-pressed={showUserManagement}
                aria-label={`${showUserManagement ? 'Hide' : 'Show'} user management panel`}
                onClick={() => setShowUserManagement(!showUserManagement)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${showUserManagement
                  ? 'bg-green-500 text-white border border-green-400 shadow-lg shadow-green-500/25'
                  : 'text-white border border-white/30 hover:border-green-400 backdrop-blur-sm bg-slate-800/50'
                  }`}
              >
                {showUserManagement ? 'Hide Team' : 'Team'}
              </button>
              <button
                type="button"
                role="tab"
                aria-pressed={showDeadlineManagement}
                aria-label={`${showDeadlineManagement ? 'Hide' : 'Show'} deadline management panel`}
                onClick={() => setShowDeadlineManagement(!showDeadlineManagement)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${showDeadlineManagement
                  ? 'bg-orange-500 text-white border border-orange-400 shadow-lg shadow-orange-500/25'
                  : 'text-white border border-white/30 hover:border-orange-400 backdrop-blur-sm bg-slate-800/50'
                  }`}
              >
                {showDeadlineManagement ? 'Hide Deadlines' : 'Deadlines'}
              </button>
              <button
                type="button"
                role="tab"
                aria-pressed={showScheduleManagement}
                aria-label={`${showScheduleManagement ? 'Hide' : 'Show'} schedule management panel`}
                onClick={() => setShowScheduleManagement(!showScheduleManagement)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${showScheduleManagement
                  ? 'bg-teal-500 text-white border border-teal-400 shadow-lg shadow-teal-500/25'
                  : 'text-white border border-white/30 hover:border-teal-400 backdrop-blur-sm bg-slate-800/50'
                  }`}
              >
                {showScheduleManagement ? 'Hide Schedule' : 'Schedule'}
              </button>
              <button
                type="button"
                role="tab"
                aria-pressed={showTaskDashboard}
                aria-label={`${showTaskDashboard ? 'Hide' : 'Show'} task progress dashboard`}
                onClick={() => setShowTaskDashboard(!showTaskDashboard)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${showTaskDashboard
                  ? 'bg-indigo-500 text-white border border-indigo-400 shadow-lg shadow-indigo-500/25'
                  : 'text-white border border-white/30 hover:border-indigo-400 backdrop-blur-sm bg-slate-800/50'
                  }`}
              >
                {showTaskDashboard ? 'Hide Dashboard' : 'Dashboard'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="backdrop-blur-md border-l-4 border-red-400 p-4 bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-100">{error}</p>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="backdrop-blur-md border-l-4 border-green-400 p-4 bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <p className="text-green-100">{successMessage}</p>
          </div>
        </div>
      )}
      {loading && (
        <div className="backdrop-blur-md border-l-4 border-blue-400 p-4 bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <p className="text-blue-100">Loading...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="flex-1 space-y-8">
            {/* Management Sections */}
            {showUserManagement && (
              <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl bg-slate-800/30">
                <UserManagement
                  users={users}
                  setUsers={setUsers}
                  onUserUpdate={handleUserUpdate}
                  onUserDelete={handleUserDelete}
                  onSuccess={showSuccess}
                  onError={showError}
                />
              </div>
            )}

            {showIssueManagement && (
              <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl bg-slate-800/30">
                <IssueManagement
                  projectId={selectedProject?._id}
                  users={projectMembers}
                  onSuccess={showSuccess}
                  onError={showError}
                />
              </div>
            )}

            {showDeadlineManagement && (
              <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl bg-slate-800/30">
                <DeadlineManagement onSuccess={showSuccess} onError={showError} />
              </div>
            )}

            {showScheduleManagement && (
              <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl bg-slate-800/30">
                <ScheduleManagement userId={userId} onSuccess={showSuccess} onError={showError} />
              </div>
            )}

            {showTaskDashboard && (
              <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 transform transition-all duration-300 hover:shadow-2xl bg-slate-800/30">
                <TaskProgressDashboard
                  projects={projects}
                  tasks={tasks}
                  users={users}
                />
              </div>
            )}

            {/* Projects Section */}
            <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/20 bg-slate-800/30">
              <div className="p-6 border-b border-white/20">
                <h2 className="text-xl font-semibold text-white drop-shadow-lg">Projects</h2>
              </div>

              {/* Create Project Form */}
              <div className="p-6 border-b border-white/20">
                <h3 className="text-lg font-medium text-white mb-4 drop-shadow-lg">Create New Project</h3>
                <form onSubmit={handleProjectSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Project Name</label>
                      <input
                        className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 placeholder-white/60 backdrop-blur-sm bg-slate-700/50"
                        placeholder="Enter project name"
                        value={projectForm.name}
                        onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Description</label>
                      <input
                        className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 placeholder-white/60 backdrop-blur-sm bg-slate-700/50"
                        placeholder="Project description"
                        value={projectForm.description}
                        onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Deadline</label>
                      <input
                        className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm bg-slate-700/50"
                        type="date"
                        value={projectForm.deadline}
                        onChange={e => setProjectForm({ ...projectForm, deadline: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Team Member Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3 drop-shadow-lg">Team Members</label>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Team member selection">
                      {users.map(user => (
                        <button
                          key={user._id}
                          type="button"
                          role="checkbox"
                          aria-checked={selectedUsers.some(u => u._id === user._id)}
                          aria-label={`${selectedUsers.some(u => u._id === user._id) ? 'Remove' : 'Add'} ${user.name} to team`}
                          onClick={() => handleUserSelect(user)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-300 transform hover:scale-105 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${selectedUsers.some(u => u._id === user._id)
                            ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400 shadow-lg shadow-emerald-500/25'
                            : 'bg-indigo-500 text-white border-indigo-400 hover:bg-indigo-400 shadow-lg shadow-indigo-500/25'
                            }`}
                        >
                          {user.name}
                        </button>
                      ))}
                    </div>
                    {selectedUsers.length > 0 && (
                      <p className="text-sm text-white/80 mt-2">
                        Selected: {selectedUsers.map(u => u.name).join(', ')}
                      </p>
                    )}
                  </div>

                  <button
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/25 transform hover:scale-105"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                </form>
              </div>

              {/* Projects List */}
              <div className="p-6">
                <div className="space-y-4">
                  {projects.map(project => (
                    <div key={project._id}>
                      <ProjectCard
                        project={project}
                        users={users}
                        onSelect={handleSelectProject}
                      />
                      {selectedProject && selectedProject._id === project._id && (
                        <div className="mt-6 space-y-6">
                          {/* Project Progress */}
                          <ProjectProgress project={selectedProject} tasks={tasks} users={users} />

                          {/* Tasks Section */}
                          <div className="rounded-2xl p-6 border border-white/20 backdrop-blur-sm bg-slate-800/30">
                            <h3 className="text-lg font-medium text-white mb-4 drop-shadow-lg">Tasks for {selectedProject.name}</h3>

                            {filteredTasks.length === 0 && (
                              <div className="text-center py-8 text-white/60">
                                <p>No tasks for this project yet. Add a new task below.</p>
                              </div>
                            )}

                            {/* Bulk Task Assignment */}
                            <div className="mb-6">
                              <BulkTaskAssignment
                                tasks={tasks}
                                users={projectMembers}
                                onBulkAssign={handleBulkAssign}
                                onSuccess={showSuccess}
                                onError={showError}
                              />
                            </div>

                            {/* Create Task Form */}
                            <div className="backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 bg-slate-800/30">
                              <h4 className="font-medium text-white mb-4 drop-shadow-lg">Add New Task</h4>
                              <form onSubmit={handleTaskSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Task Title</label>
                                    <input
                                      className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 placeholder-white/60 backdrop-blur-sm bg-slate-700/50"
                                      placeholder="Task title"
                                      value={taskForm.title}
                                      onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                                      required
                                      disabled={loading}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Description</label>
                                    <input
                                      className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 placeholder-white/60 backdrop-blur-sm bg-slate-700/50"
                                      placeholder="Description"
                                      value={taskForm.description}
                                      onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                      disabled={loading}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Deadline</label>
                                    <input
                                      className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm bg-slate-700/50"
                                      type="date"
                                      value={taskForm.deadline}
                                      onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                      disabled={loading}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Assign To</label>
                                    <select
                                      className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm bg-slate-700/50"
                                      value={taskForm.assignedTo}
                                      onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                      disabled={loading}
                                    >
                                      <option value="">Select User</option>
                                      {projectMembers.map(user => (
                                        <option key={user._id} value={user._id}>
                                          {user.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-white mb-2 drop-shadow-lg">Hours</label>
                                    <input
                                      className="w-full px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 placeholder-white/60 backdrop-blur-sm bg-slate-700/50"
                                      type="number"
                                      placeholder="Hours"
                                      value={taskForm.estimatedHours}
                                      onChange={e => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                                      min="0"
                                      step="0.5"
                                      disabled={loading}
                                    />
                                  </div>
                                </div>
                                <button
                                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-cyan-700 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 shadow-lg shadow-cyan-500/25 transform hover:scale-105"
                                  type="submit"
                                  disabled={loading}
                                >
                                  {loading ? 'Adding...' : 'Add Task'}
                                </button>
                              </form>
                            </div>

                            {/* Task Filter */}
                            <div className="mb-4">
                              <select
                                className="px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm bg-slate-700/50"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                              >
                                <option value="">All Statuses</option>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="done">Done</option>
                              </select>
                            </div>

                            {/* Tasks List */}
                            <div className="space-y-3">
                              {filteredTasks.length > 0 && (
                                filteredTasks.map(task => (
                                  <TaskCard
                                    key={task._id}
                                    task={task}
                                    users={projectMembers}
                                    onEdit={handleEditTask}
                                    onDelete={handleDeleteTask}
                                    onSuccess={showSuccess}
                                    onError={showError}
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Notifications */}
          <div className="lg:w-80">
            <div className="backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6 sticky top-8 transform transition-all duration-300 hover:shadow-2xl bg-slate-800/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white drop-shadow-lg">Notifications</h3>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>
              <NotificationList notifications={notifications} onMarkRead={handleMarkNotificationRead} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="backdrop-blur-md border-t border-white/20 mt-12 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-white/80 text-sm">
            <p>&copy; {new Date().getFullYear()} Task Management System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
