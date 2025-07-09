# Email Notification Setup - Step by Step Guide

## ✅ What I've Fixed

task management system ensure email notifications are sent **only when tasks are created and assigned**, not when users are created. Here's what was fixed:

1. **Removed duplicate email sending** - Now uses a unified notification system
2. **Improved email templates** - Better formatting with project information
3. **Consistent notification flow** - All task assignments use the same system
4. **Better error handling** - More robust email sending with proper logging

## 🚀 Setup Steps

### Step 1: Create Environment File
Create a `.env` file in the `server` directory:

```bash
# Copy the template
cp server/env.template server/.env
```

### Step 2: Configure Your Email Settings
Edit the `server/.env` file with your actual email credentials:

```env
# Database Configuration
MONGO_URI=mongodb://127.0.0.1:27017/task_management

# Server Configuration
PORT=4000
NODE_ENV=development

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password
EMAIL_FROM=Task Management System <your-actual-email@gmail.com>
ENABLE_EMAIL_NOTIFICATIONS=true

# Debug Mode
DEBUG=true
```

### Step 3: Get Your App Password

#### For Gmail:
1. Go to [Google Account settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Select "Mail" and generate a new app password
4. Copy the 16-character password (no spaces or quotes)

#### For Outlook:
1. Account settings → Security
2. Advanced security options → App passwords
3. Generate a new app password

#### For Yahoo:
1. Account Security → App passwords
2. Generate a new app password

### Step 4: Test Your Email Configuration
Run the test script to verify everything is working:

```bash
cd server
node test-email.js
```

You should see:
```
✅ Email configuration is valid!
✅ Test email sent successfully!
📧 Check your inbox at: your-email@gmail.com
```

### Step 5: Start Your Server
```bash
cd server
npm start
```

You should see:
```
✅ Email configuration validated
✅ Email notifications enabled
```

## 🧪 Testing Task Notifications

### Test 1: Create a Task with Assignment
1. Open your task management system
2. Create a new task
3. Assign it to a user with a valid email address
4. Check the assigned user's email inbox

### Test 2: Reassign a Task
1. Edit an existing task
2. Change the assigned user
3. Check the new assigned user's email inbox

## 📧 What Emails Will Be Sent

### ✅ Task Creation (NEW TASK ASSIGNED)
- **When:** A new task is created and assigned to a user
- **Recipient:** The assigned user
- **Content:** Task title, project name, professional formatting
- **Subject:** "New Task Assigned: [Task Title]"

### ✅ Task Reassignment (TASK REASSIGNED)
- **When:** An existing task is reassigned to a different user
- **Recipient:** The newly assigned user
- **Content:** Task title, project name, professional formatting
- **Subject:** "New Task Assigned: [Task Title]"

### ❌ User Creation (NO EMAIL)
- **When:** A new user account is created
- **Email:** None sent (as requested)

## 🔧 Troubleshooting

### Issue: "Email configuration issues"
**Solution:** Check your `.env` file and make sure all email variables are set correctly.

### Issue: "Authentication failed"
**Solution:** 
- Verify you're using an App Password, not your regular password
- Make sure 2-Factor Authentication is enabled
- Double-check the email address and password

### Issue: "Emails not sending"
**Solution:**
- Run `node test-email.js` to test configuration
- Check server logs for error messages
- Verify `ENABLE_EMAIL_NOTIFICATIONS=true` in `.env`

### Issue: "Emails going to spam"
**Solution:**
- Add your email to the recipient's contacts
- Use a business email domain if possible
- Check spam/junk folder

## 📊 Email Features

### Professional Templates
- Responsive design (works on mobile/desktop)
- Company branding
- Clear call-to-action buttons
- Color-coded urgency levels

### Smart Notifications
- Only sends when necessary
- Tracks email delivery status
- Prevents duplicate emails
- Includes project context

### Security
- Uses App Passwords (more secure)
- Environment variable configuration
- No sensitive data in code

## 🎉 Success!

Once configured, your task management system will automatically send professional email notifications when:
- ✅ New tasks are created and assigned
- ✅ Existing tasks are reassigned
- ❌ Users are created (no email sent, as requested)

The emails will include task details, project information, and professional formatting to keep your team informed and productive!

## 📞 Need Help?

If you encounter any issues:
1. Check the server logs for error messages
2. Run the test script: `node test-email.js`
3. Verify your `.env` configuration
4. Check the detailed setup guide in `EMAIL_SETUP.md` 