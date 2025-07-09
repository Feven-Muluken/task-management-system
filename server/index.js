const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const issueRoutes = require('./routes/issueRoutes');
const deadlineRoutes = require('./routes/deadlineRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const cronRoutes = require('./routes/cronRoutes');
const { initCronJobs } = require('./cronJobs');
const { validateEmailConfig } = require('./config/emailConfig');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// TODO: Add routes here

app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/cron', cronRoutes);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_management';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');

    // Validate email configuration
    const emailValidation = validateEmailConfig();
    if (emailValidation.isValid) {
      console.log('✅ Email configuration validated');
      console.log('✅ Email notifications enabled');
    } else {
      console.log('⚠️ Email configuration issues:');
      emailValidation.errors.forEach(error => console.log(`   - ${error}`));
      console.log('📧 See EMAIL_SETUP.md for configuration instructions');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Initialize cron jobs after server starts
      initCronJobs();
    });
  })
  .catch(err => console.error('MongoDB connection error:', err)); 