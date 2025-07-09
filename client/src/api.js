import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Project APIs
export const getProjects = () => api.get('/projects');
export const createProject = (data) => api.post('/projects', data);

// Task APIs
export const getTasks = (projectId) => api.get('/tasks', { params: { projectId } });
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// User APIs
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Notification APIs
export const getNotificationsByUser = (userId) => api.get(`/notifications/user/${userId}`);
export const markNotificationAsRead = (id) => api.patch(`/notifications/${id}/read`);

// Issue APIs
export const getIssues = (params) => api.get('/issues', { params });
export const createIssue = (data) => api.post('/issues', data);
export const updateIssue = (id, data) => api.put(`/issues/${id}`, data);
export const deleteIssue = (id) => api.delete(`/issues/${id}`);
export const addIssueComment = (id, data) => api.post(`/issues/${id}/comments`, data);
export const updateIssueStatus = (id, data) => api.patch(`/issues/${id}/status`, data);
export const getIssueStats = (params) => api.get('/issues/stats', { params });

// Deadline Management APIs
export const getOverdueItems = (userId) => api.get('/deadlines/overdue', { params: { userId } });
export const getUpcomingDeadlines = (userId, days = 7) => api.get('/deadlines/upcoming', { params: { userId, days } });
export const getDeadlineStats = (userId) => api.get('/deadlines/stats', { params: { userId } });
export const getCalendarData = (userId, startDate, endDate) => api.get('/deadlines/calendar', { params: { userId, startDate, endDate } });
export const requestTaskExtension = (taskId, data) => api.post(`/deadlines/tasks/${taskId}/extension`, data);
export const requestProjectExtension = (projectId, data) => api.post(`/deadlines/projects/${projectId}/extension`, data);
export const reviewExtension = (itemType, itemId, extensionId, data) => api.put(`/deadlines/${itemType}/${itemId}/extension/${extensionId}`, data);
export const addMilestone = (projectId, data) => api.post(`/deadlines/projects/${projectId}/milestones`, data);
export const completeMilestone = (projectId, milestoneId) => api.put(`/deadlines/projects/${projectId}/milestones/${milestoneId}/complete`);

// Work Schedule Management APIs
export const getUserSchedule = (userId) => api.get(`/schedule/users/${userId}/schedule`);
export const updateUserSchedule = (userId, data) => api.put(`/schedule/users/${userId}/schedule`, data);
export const requestVacation = (userId, data) => api.post(`/schedule/users/${userId}/vacation`, data);
export const getTeamAvailability = (params) => api.get('/schedule/team/availability', { params });
export const getWorkloadDistribution = () => api.get('/schedule/team/workload');

// Bulk Task Assignment API
export const bulkAssignTasks = (taskIds, userId) => api.put('/tasks/bulk-assign', { taskIds, assignedTo: userId });

export default api; 