import React from 'react';

const ProjectProgress = ({ project, tasks, users }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;

  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 p-6 mb-4 shadow bg-white">
      <h3 className="text-lg font-bold text-gray-900 mb-4 drop-shadow-lg">Project Progress</h3>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-gray-900 drop-shadow-sm">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 border border-gray-300">
          <div
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-100 rounded-xl border border-gray-200 shadow hover:shadow-md transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-gray-900 mb-1 drop-shadow-sm">{totalTasks}</div>
          <div className="text-xs text-gray-500">Total Tasks</div>
        </div>

        <div className="text-center p-4 bg-gray-100 rounded-xl border border-gray-200 shadow hover:shadow-md transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-blue-500 mb-1 drop-shadow-sm">{inProgressTasks}</div>
          <div className="text-xs text-blue-500">In Progress</div>
        </div>

        <div className="text-center p-4 bg-gray-100 rounded-xl border border-gray-200 shadow hover:shadow-md transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-green-500 mb-1 drop-shadow-sm">{completedTasks}</div>
          <div className="text-xs text-green-500">Completed</div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between p-3 backdrop-blur-sm bg-slate-700/30 rounded-lg border border-white/10">
          <span className="text-sm text-white/70">To Do</span>
          <span className="text-sm font-semibold text-white drop-shadow-sm">{todoTasks}</span>
        </div>
        <div className="flex items-center justify-between p-3 backdrop-blur-sm bg-slate-700/30 rounded-lg border border-white/10">
          <span className="text-sm text-white/70">In Progress</span>
          <span className="text-sm font-semibold text-blue-400 drop-shadow-sm">{inProgressTasks}</span>
        </div>
        <div className="flex items-center justify-between p-3 backdrop-blur-sm bg-slate-700/30 rounded-lg border border-white/10">
          <span className="text-sm text-white/70">Completed</span>
          <span className="text-sm font-semibold text-green-400 drop-shadow-sm">{completedTasks}</span>
        </div>
      </div>

      {/* Team Workload Distribution */}
      {tasks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-white mb-3 drop-shadow-lg">Team Workload</h4>
          <div className="space-y-2">
            {Array.from(new Set(tasks.map(task => task.assignedTo).filter(Boolean))).map(userId => {
              const userTasks = tasks.filter(task => task.assignedTo === userId);
              const userCompleted = userTasks.filter(task => task.status === 'done').length;
              const userProgress = userTasks.length > 0 ? Math.round((userCompleted / userTasks.length) * 100) : 0;
              const user = users?.find(u => u._id === userId);

              return (
                <div key={userId} className="flex items-center justify-between p-2 backdrop-blur-sm bg-slate-700/20 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/80">{user?.name || 'Unknown User'}</span>
                    <span className="text-xs text-white/50">({userTasks.length} tasks)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-600/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${userProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-white/60">{userProgress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectProgress; 