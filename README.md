# Task Management System

A comprehensive task and project management system built with React, Node.js, and MongoDB.

## Features

### ✅ Implemented Features

1. **Project Management**
   - Create and manage projects
   - Set project deadlines
   - Assign team members to projects
   - Project status tracking (not started, in progress, completed)

2. **Task Management**
   - Create tasks within projects
   - Assign tasks to team members
   - Set task deadlines
   - Track task status (todo, in progress, done)
   - Mark tasks as issues

3. **User Management**
   - Add, edit, and delete team members
   - User roles (admin, member)
   - Assign users to projects
   - User selection for task assignment

4. **Project Progress Tracking**
   - Visual progress bars
   - Task completion statistics
   - Automatic project status updates
   - Progress percentage calculation

5. **Notifications**
   - Task assignment notifications
   - Real-time notification system

### 🔄 In Progress / Planned Features

- Work schedule management
- Time tracking
- Advanced issue tracking
- Email notifications
- Calendar integration
- Advanced analytics

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd task-management-system
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the server directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/task-management
   PORT=4000
   ```

5. **Seed the database with sample users**
   ```bash
   cd server
   npm run seed
   ```

6. **Start the server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

7. **Start the client**
   ```bash
   cd ../client
   npm start
   ```

## Usage

### User Management

1. Click "Manage Team" in the header to access user management
2. Add new team members with their name, email, password, and role
3. Edit or delete existing users
4. Users can be assigned to projects during project creation

### Project Management

1. Create new projects with name, description, deadline, and team members
2. View project progress with visual indicators
3. Project status automatically updates based on task completion

### Task Management

1. Select a project to view its tasks
2. Add new tasks with title, description, deadline, and assignment
3. Edit task status and details
4. Mark tasks as issues when problems arise

### Progress Tracking

- **Project Progress Bar**: Shows completion percentage
- **Task Statistics**: Displays counts for todo, in progress, and completed tasks
- **Status Indicators**: Visual status badges for projects and tasks
- **Automatic Updates**: Project status updates when tasks are completed

## API Endpoints

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

### Tasks
- `GET /api/tasks?projectId=:id` - Get tasks for a project
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Notifications
- `GET /api/notifications/user/:userId` - Get notifications for a user
- `PATCH /api/notifications/:id/read` - Mark notification as read

## Database Schema

### Project
```javascript
{
  name: String (required),
  description: String,
  tasks: [ObjectId],
  members: [ObjectId],
  status: String (enum: ['not started', 'in progress', 'completed']),
  deadline: Date,
  timestamps: true
}
```

### Task
```javascript
{
  title: String (required),
  description: String,
  assignedTo: ObjectId (ref: 'User'),
  deadline: Date,
  projectId: ObjectId (ref: 'Project'),
  issue: Boolean (default: false),
  status: String (enum: ['todo', 'in_progress', 'done']),
  timestamps: true
}
```

### User
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  role: String (enum: ['admin', 'member']),
  timestamps: true
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 