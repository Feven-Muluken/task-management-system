import React from 'react';
import { Link } from 'react-router-dom';

const ProjectCard = ({ project, users, onSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-800/50 text-green-300 border-green-600/50';
      case 'completed':
        return 'bg-blue-800/50 text-blue-300 border-blue-600/50';
      case 'on_hold':
        return 'bg-yellow-800/50 text-yellow-300 border-yellow-600/50';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const getMemberNames = (members) => {
    if (!members) return [];

    // Handle both populated members (objects) and member IDs (strings)
    if (members.length > 0 && typeof members[0] === 'object' && members[0].name) {
      // Members are populated objects
      return members.map(member => member.name);
    } else if (users) {
      // Members are IDs, filter through users
      return users
        .filter(user => members.includes(user._id))
        .map(user => user.name);
    }

    return [];
  };

  const isOverdue = project.deadline && new Date(project.deadline) < new Date();

  return (
    <div
      className="rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 bg-white"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2 drop-shadow-lg">{project.name}</h3>
          {project.description && (
            <p className="text-gray-700 text-sm mb-3">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(project.status)} transition-all duration-200 hover:scale-105`}>
            {project.status?.replace('_', ' ').toUpperCase() || 'ACTIVE'}
          </span>
          {isOverdue && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-800/50 text-red-300 border border-red-600/50 animate-pulse backdrop-blur-sm">
              OVERDUE
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 font-medium">Deadline:</span>
          <span className={`ml-2 ${isOverdue ? 'text-red-400 font-semibold' : 'text-gray-800'}`}>
            {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline set'}
          </span>
        </div>

        <div>
          <span className="text-gray-500 font-medium">Team Members:</span>
          <div className="mt-1">
            {getMemberNames(project.members).length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {getMemberNames(project.members).map((name, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-800/50 text-blue-300 text-xs rounded-md border border-blue-600/50 transition-all duration-200 hover:bg-blue-700/50 hover:scale-105 backdrop-blur-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">No members assigned</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            <Link
              to={`/projects/${project._id}`}
              className="text-green-600 hover:text-green-800 font-medium text-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent rounded border border-green-200 px-3 py-1 bg-green-50"
              onClick={e => {
                e.stopPropagation();
                if (onSelect) onSelect(project);
              }}
            >
              View Tasks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard; 