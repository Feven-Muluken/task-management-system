const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { createNotificationWithEmail } = require('../controllers/notificationController');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ isActive: { $ne: false } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'member',
      department
    });

    await user.save();

    // Send welcome notification
    try {
      await createNotificationWithEmail({
        userId: user._id,
        title: 'Welcome to Task Management System',
        message: `Welcome ${name}! Your account has been created successfully. You can now log in and start managing your tasks.`,
        type: 'welcome',
        priority: 'low'
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail user creation if email fails
    }

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if trying to delete the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Soft delete
    await User.findByIdAndUpdate(req.params.id, { isActive: false, deletedAt: new Date() });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '1d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 