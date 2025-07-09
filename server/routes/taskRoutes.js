const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Create a new task
router.post('/', taskController.createTask);

// Get all tasks
router.get('/', taskController.getTasks);

// Get a single task by ID
router.get('/:id', taskController.getTaskById);

// Update a task
router.put('/:id', taskController.updateTask);

// Delete a task
router.delete('/:id', taskController.deleteTask);

// Bulk assign tasks
router.put('/bulk-assign', taskController.bulkAssignTasks);

module.exports = router; 