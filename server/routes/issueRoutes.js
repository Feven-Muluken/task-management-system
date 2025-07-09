const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');

// Create a new issue
router.post('/', issueController.createIssue);

// Get all issues with filtering
router.get('/', issueController.getIssues);

// Get issue statistics
router.get('/stats', issueController.getIssueStats);

// Get a single issue by ID
router.get('/:id', issueController.getIssueById);

// Update an issue
router.put('/:id', issueController.updateIssue);

// Delete an issue
router.delete('/:id', issueController.deleteIssue);

// Add comment to issue
router.post('/:id/comments', issueController.addComment);

// Update issue status
router.patch('/:id/status', issueController.updateStatus);

module.exports = router; 