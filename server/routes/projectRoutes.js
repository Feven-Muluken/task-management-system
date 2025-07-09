const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Create a new project
router.post('/', async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    // Populate the members field before sending response
    const populatedProject = await Project.findById(project._id).populate('members').populate('tasks');
    res.status(201).json(populatedProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().populate('members').populate('tasks');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members').populate('tasks');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    // Populate the members field before sending response
    const populatedProject = await Project.findById(project._id).populate('members').populate('tasks');
    res.json(populatedProject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 