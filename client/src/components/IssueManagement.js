import React, { useState, useEffect } from 'react';
import {
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
  addIssueComment,
  updateIssueStatus,
  getIssueStats
} from '../api';

const IssueManagement = ({ projectId, users, onSuccess, onError }) => {
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  // Use the first user as default reporter (temporary solution)
  const defaultUserId = users && users.length > 0 ? users[0]._id : null;
  const [filters, setFilters] = useState({
    status: 'all',
    priority: '',
    category: '',
    assignedTo: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'bug',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    tags: '',
    estimatedHours: '',
    projectId: projectId || ''
  });
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIssues();
    fetchStats();
  }, [projectId, filters]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = { projectId, ...filters };
      const response = await getIssues(params);
      setIssues(response.data);
    } catch (error) {
      onError('Failed to fetch issues. Please try again.');
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getIssueStats({ projectId });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const issueData = {
        ...formData,
        reportedBy: defaultUserId, // Use first user as default
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      // Convert empty string to null for assignedTo
      if (issueData.assignedTo === '') {
        issueData.assignedTo = null;
      }

      if (selectedIssue) {
        await updateIssue(selectedIssue._id, issueData);
        onSuccess(`Issue "${formData.title}" updated successfully!`);
      } else {
        await createIssue(issueData);
        onSuccess(`Issue "${formData.title}" created successfully! Email notification sent to assigned user.`);
      }

      setFormData({
        title: '',
        description: '',
        category: 'bug',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        tags: '',
        estimatedHours: '',
        projectId: projectId || ''
      });
      setSelectedIssue(null);
      setShowForm(false);
      fetchIssues();
      fetchStats();
    } catch (error) {
      onError(error.response?.data?.error || 'Failed to save issue. Please try again.');
      console.error('Failed to save issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteIssue(issueId);
      onSuccess('Issue deleted successfully!');
      fetchIssues();
      fetchStats();
    } catch (error) {
      onError(error.response?.data?.error || 'Failed to delete issue. Please try again.');
      console.error('Failed to delete issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await updateIssueStatus(issueId, { status: newStatus, userId: defaultUserId });
      fetchIssues();
      fetchStats();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAddComment = async (issueId) => {
    if (!commentText.trim()) return;
    try {
      await addIssueComment(issueId, { content: commentText, userId: defaultUserId });
      setCommentText('');
      fetchIssues();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white';
      case 'high': return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
      case 'medium': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black';
      case 'low': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200';
      case 'in_progress': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-200';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bug': return '🐛';
      case 'feature': return '✨';
      case 'blocker': return '🚫';
      case 'enhancement': return '⚡';
      case 'question': return '❓';
      default: return '📋';
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filters.status === 'all') return true;
    return issue.status === filters.status;
  });

  return (
    <div className="backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6 shadow-xl bg-slate-800/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white drop-shadow-lg">Issue Management</h2>
        <button
          type="button"
          aria-label={showForm ? 'Cancel adding issue' : 'Add new issue'}
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/25 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          disabled={loading}
        >
          {showForm ? 'Cancel' : 'Add Issue'}
        </button>
      </div>

      {/* Issue Statistics */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-white mb-1 drop-shadow-sm">{stats.total}</div>
          <div className="text-xs text-white/60">Total</div>
        </div>
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-red-400 mb-1 drop-shadow-sm">{stats.open}</div>
          <div className="text-xs text-white/60">Open</div>
        </div>
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-blue-400 mb-1 drop-shadow-sm">{stats.inProgress}</div>
          <div className="text-xs text-white/60">In Progress</div>
        </div>
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-green-400 mb-1 drop-shadow-sm">{stats.resolved}</div>
          <div className="text-xs text-white/60">Resolved</div>
        </div>
        <div className="text-center p-4 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="text-2xl font-bold text-purple-400 mb-1 drop-shadow-sm">{stats.closed}</div>
          <div className="text-xs text-white/60">Closed</div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 drop-shadow-lg">
            {selectedIssue ? 'Edit Issue' : 'Add New Issue'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Title</label>
              <input
                type="text"
                className="w-full bg-slate-600/50 border border-white/30 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Priority</label>
              <select
                className="w-full bg-slate-600/50 border border-white/30 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
              <select
                className="w-full bg-slate-600/50 border border-white/30 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={loading}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Assign To (Project Member)</label>
              <select
                className="w-full bg-slate-600/50 border border-white/30 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                disabled={loading}
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
            <textarea
              className="w-full bg-slate-600/50 border border-white/30 text-white p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 backdrop-blur-sm"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              aria-label={loading ? (selectedIssue ? 'Updating issue...' : 'Creating issue...') : (selectedIssue ? 'Update issue' : 'Create issue')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/25 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              disabled={loading}
            >
              {loading ? (selectedIssue ? 'Updating...' : 'Creating...') : (selectedIssue ? 'Update' : 'Create')} Issue
            </button>
            <button
              type="button"
              aria-label="Cancel issue form"
              className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-slate-500/25 transform hover:scale-105 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              onClick={() => {
                setShowForm(false);
                setSelectedIssue(null);
                setFormData({
                  title: '',
                  description: '',
                  category: 'bug',
                  priority: 'medium',
                  assignedTo: '',
                  dueDate: '',
                  tags: '',
                  estimatedHours: '',
                  projectId: projectId || ''
                });
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          className="bg-slate-700/50 border border-white/30 text-white p-2 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Issues</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Issues List */}
      {loading && !showForm ? (
        <div className="text-center py-8">
          <div className="text-white/60">Loading issues...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <div key={issue._id} className="backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{issue.title}</h3>
                  <p className="text-white/70 text-sm mb-3">{issue.description}</p>

                  <div className="flex gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-lg text-white text-xs font-medium backdrop-blur-sm ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-white text-xs font-medium backdrop-blur-sm ${getStatusColor(issue.status)}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>

                  {issue.assignedTo && (
                    <p className="text-white/60 text-sm">
                      Assigned to: {issue.assignedTo.name || 'Unknown'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={`Edit issue: ${issue.title}`}
                  onClick={() => {
                    setSelectedIssue(issue);
                    setFormData({
                      title: issue.title,
                      description: issue.description,
                      category: issue.category,
                      priority: issue.priority,
                      assignedTo: issue.assignedTo?._id || '',
                      dueDate: issue.dueDate ? issue.dueDate.slice(0, 10) : '',
                      tags: issue.tags ? issue.tags.join(', ') : '',
                      estimatedHours: issue.estimatedHours || '',
                      projectId: projectId || ''
                    });
                    setShowForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/25 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label={`Delete issue: ${issue.title}`}
                  onClick={() => handleDelete(issue._id)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-lg text-sm hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-red-500/25 transform hover:scale-105 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredIssues.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">No issues found</div>
          <div className="text-gray-500 text-sm">
            {filters.status === 'all' ? 'Create your first issue to get started' : `No ${filters.status} issues found`}
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueManagement; 