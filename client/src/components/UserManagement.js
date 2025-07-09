import React, { useState } from 'react';
import { createUser, updateUser, deleteUser } from '../api';

const UserManagement = ({ users, setUsers, onUserUpdate, onUserDelete, onSuccess, onError }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    department: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = { ...formData };
      if (editingUser) {
        if (!userData.password) {
          delete userData.password;
        }
        const updated = await updateUser(editingUser._id, userData);
        setUsers(users => users.map(u => u._id === editingUser._id ? updated.data : u));
        if (onUserUpdate) onUserUpdate(updated.data);
        onSuccess(`User ${formData.name} updated successfully!`);
      } else {
        if (!userData.password) {
          onError('Password is required for new users.');
          setLoading(false);
          return;
        }
        const created = await createUser(userData);
        setUsers(users => [...users, created.data]);
        onSuccess(`User ${formData.name} created successfully!`);
      }
      setFormData({ name: '', email: '', password: '', role: 'member', department: '' });
      setEditingUser(null);
      setShowForm(false);
    } catch (error) {
      let errorMessage = 'Failed to save user. Please try again.';
      if (error.response?.data?.error) {
        const serverError = error.response.data.error;
        if (serverError.includes('duplicate key') || serverError.includes('already exists')) {
          errorMessage = 'A user with this email address already exists. Please use a different email.';
        } else if (serverError.includes('validation failed')) {
          errorMessage = 'Please check your input. All required fields must be filled correctly.';
        } else {
          errorMessage = serverError;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      onError(errorMessage);
      console.error('Failed to save user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    const userToDelete = users.find(u => u._id === userId);
    if (!userToDelete) {
      onError('User not found.');
      return;
    }
    if (userToDelete.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        onError('Cannot delete the last admin user. At least one admin must remain in the system.');
        return;
      }
    }
    const confirmMessage = userToDelete.role === 'admin'
      ? `Are you sure you want to delete admin user "${userToDelete.name}"? This action cannot be undone.`
      : `Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      await deleteUser(userId);
      setUsers(users => users.filter(u => u._id !== userId));
      if (onUserDelete) onUserDelete(userId);
      onSuccess(`User "${userToDelete.name}" deleted successfully!`);
    } catch (error) {
      let errorMessage = 'Failed to delete user. Please try again.';
      if (error.response?.data?.error) {
        const serverError = error.response.data.error;
        if (serverError.includes('Cannot delete the last admin')) {
          errorMessage = 'Cannot delete the last admin user. At least one admin must remain in the system.';
        } else if (serverError.includes('not found')) {
          errorMessage = 'User not found. It may have been deleted already.';
        } else {
          errorMessage = serverError;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      onError(errorMessage);
      console.error('Failed to delete user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-800/50 text-red-200 border-red-600/50';
      case 'manager': return 'bg-slate-600/50 text-slate-200 border-slate-600/50';
      case 'member': return 'bg-slate-700/50 text-slate-200 border-slate-600/50';
      default: return 'bg-slate-700/50 text-slate-200 border-slate-600/50';
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin': return 'Full system access - Can manage all users and settings';
      case 'manager': return 'Project management - Can create and manage projects';
      case 'member': return 'Basic user access - Can view and update assigned tasks';
      default: return 'Basic user access';
    }
  };

  const canDeleteUser = (user) => {
    if (user.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      return adminCount > 1;
    }
    return true;
  };

  return (
    <div className="rounded-2xl border border-gray-200 p-6 mb-6 shadow bg-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 drop-shadow-lg">User Management</h2>
        <button
          type="button"
          aria-label={showForm ? 'Cancel adding user' : 'Add new user'}
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 border border-gray-300 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white"
          disabled={loading}
        >
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4 drop-shadow-lg">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                disabled={loading}
                placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                disabled={loading}
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                className="w-full bg-gray-100 border border-gray-300 text-gray-900 p-3 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                disabled={loading}
                placeholder="Enter department (optional)"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              aria-label={loading ? (editingUser ? 'Updating user...' : 'Creating user...') : (editingUser ? 'Update user' : 'Create user')}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-500/25 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              disabled={loading}
            >
              {loading ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update' : 'Create')} User
            </button>
            <button
              type="button"
              aria-label="Cancel user form"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 border border-gray-300 transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white"
              onClick={() => {
                setShowForm(false);
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', role: 'member', department: '' });
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {/* User List */}
      <div className="space-y-4">
        {users.map(user => (
          <div key={user._id} className="backdrop-blur-sm bg-slate-700/50 rounded-xl border border-white/20 p-4 flex flex-col md:flex-row md:items-center md:justify-between shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-lg text-white text-xs font-medium backdrop-blur-sm ${getRoleColor(user.role)}`}>{user.role}</span>
                <span className="text-white font-semibold text-lg drop-shadow-sm">{user.name}</span>
                <span className="text-white/60 text-sm">({user.email})</span>
                {user.department && <span className="ml-2 text-xs text-white/50">{user.department}</span>}
              </div>
              <div className="text-white/60 text-xs mb-1">{getRoleDescription(user.role)}</div>
              <div className="text-white/40 text-xs">ID: {user._id}</div>
            </div>
            <div className="flex gap-2 mt-3 md:mt-0">
              <button
                type="button"
                aria-label={`Edit user ${user.name}`}
                onClick={() => handleEdit(user)}
                className="bg-slate-600/50 text-white px-3 py-1 rounded-lg text-sm hover:bg-slate-500/50 transition-all duration-300 disabled:opacity-50 border border-slate-600/50 backdrop-blur-sm transform hover:scale-105 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                disabled={loading}
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={canDeleteUser(user) ? `Delete user ${user.name}` : `Cannot delete ${user.name} - last admin user`}
                onClick={() => handleDelete(user._id)}
                className={`px-3 py-1 rounded-lg text-sm border backdrop-blur-sm transform hover:scale-105 transition-all duration-300 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${canDeleteUser(user) ? 'bg-red-800/50 text-red-200 hover:bg-red-700/50 border-red-600/50' : 'bg-slate-600/50 text-white/40 cursor-not-allowed border-slate-600/50'}`}
                disabled={loading || !canDeleteUser(user)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {users.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-white/40 text-lg mb-2">No users found</div>
          <div className="text-white/30 text-sm">Add your first user to get started</div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 