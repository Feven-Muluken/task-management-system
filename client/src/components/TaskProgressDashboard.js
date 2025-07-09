import React, { useState } from 'react';

const TaskProgressDashboard = ({ projects, tasks, users }) => {
  const [selectedProject, setSelectedProject] = useState('all');
  const [timeRange, setTimeRange] = useState('week');

  // Calculate overall statistics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const overdueTasks = tasks.filter(task => {
    if (!task.deadline || task.status === 'done') return false;
    return new Date(task.deadline) < new Date();
  }).length;

  // Filter tasks by selected project
  const filteredTasks = selectedProject === 'all'
    ? tasks
    : tasks.filter(task => task.projectId === selectedProject);

  // Calculate project-specific stats
  const projectStats = projects.map(project => {
    const projectTasks = tasks.filter(task => task.projectId === project._id);
    const completed = projectTasks.filter(task => task.status === 'done').length;
    const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

    return {
      ...project,
      totalTasks: projectTasks.length,
      completedTasks: completed,
      progress
    };
  });

  // Calculate team workload
  const teamWorkload = users.map(user => {
    const userTasks = tasks.filter(task => task.assignedTo === user._id);
    const completed = userTasks.filter(task => task.status === 'done').length;
    const overdue = userTasks.filter(task => {
      if (!task.deadline || task.status === 'done') return false;
      return new Date(task.deadline) < new Date();
    }).length;

    return {
      ...user,
      totalTasks: userTasks.length,
      completedTasks: completed,
      overdueTasks: overdue,
      progress: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0
    };
  });

  // Get recent activity (last 7 days)
  const getRecentActivity = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return tasks.filter(task => {
      if (!task.updatedAt) return false;
      return new Date(task.updatedAt) > sevenDaysAgo;
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);
  };

  const recentActivity = getRecentActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 mb-4 drop-shadow-lg">Task Progress Dashboard</h2>
        <div className="flex gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm bg-slate-700/50"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-white/30 text-white rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 backdrop-blur-sm bg-slate-700/50"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl bg-slate-800/30 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Total Projects</p>
              <p className="text-3xl font-bold text-white">{totalProjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl bg-slate-800/30 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Total Tasks</p>
              <p className="text-3xl font-bold text-white">{totalTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl bg-slate-800/30 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Completed</p>
              <p className="text-3xl font-bold text-green-400">{completedTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl bg-slate-800/30 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Overdue</p>
              <p className="text-3xl font-bold text-red-400">{overdueTasks}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Project Progress */}
      <div className="backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl bg-slate-800/30">
        <h3 className="text-lg font-bold text-white mb-4 drop-shadow-lg">Project Progress</h3>
        <div className="space-y-4">
          {projectStats.map(project => (
            <div key={project._id} className="flex items-center justify-between p-4 backdrop-blur-sm bg-slate-700/30 rounded-lg border border-white/10">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-white">{project.name}</h4>
                  <span className="text-xs text-white/50">({project.totalTasks} tasks)</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-white/60">Completed: {project.completedTasks}</span>
                  <span className="text-sm text-white/60">In Progress: {project.totalTasks - project.completedTasks}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-600/50 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-white w-12">{project.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl bg-slate-800/30">
          <h3 className="text-lg font-bold text-white mb-4 drop-shadow-lg">Team Workload</h3>
          <div className="space-y-3">
            {teamWorkload.filter(user => user.totalTasks > 0).map(user => (
              <div key={user._id} className="flex items-center justify-between p-3 backdrop-blur-sm bg-slate-700/30 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-xs text-white/60">{user.totalTasks} tasks</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-600/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${user.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-white/60">{user.progress}%</span>
                  {user.overdueTasks > 0 && (
                    <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
                      {user.overdueTasks} overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl bg-slate-800/30">
          <h3 className="text-lg font-bold text-white mb-4 drop-shadow-lg">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map(task => (
              <div key={task._id} className="flex items-center gap-3 p-3 backdrop-blur-sm bg-slate-700/30 rounded-lg border border-white/10">
                <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-green-400' :
                  task.status === 'in_progress' ? 'bg-blue-400' : 'bg-slate-400'
                  }`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{task.title}</div>
                  <div className="text-xs text-white/60">
                    {task.status.replace('_', ' ')} • {new Date(task.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                {task.assignedTo && (
                  <div className="text-xs text-white/50">
                    {users.find(u => u._id === task.assignedTo)?.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskProgressDashboard; 